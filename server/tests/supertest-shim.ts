import http from 'http';
import { PassThrough } from 'stream';

class MockSocket extends PassThrough {
  remoteAddress: string;
  remotePort: number;

  constructor() {
    super();
    this.remoteAddress = '127.0.0.1';
    this.remotePort = 12345;
  }

  address() {
    return { address: '127.0.0.1', family: 'IPv4', port: 12345 };
  }
}

export interface Response {
  status: number;
  statusCode: number;
  body: any;
  text: string;
  headers: Record<string, any>;
  header: Record<string, any>;
  ok: boolean;
}

export class TestRequest implements PromiseLike<Response> {
  private app: any;
  private method: string;
  private path: string;
  private headers: Record<string, string> = {};
  private bodyData: any = undefined;
  private formFields: Array<{ name: string; value: string }> = [];
  private formAttachments: Array<{
    name: string;
    buffer: Buffer;
    filename: string;
    contentType?: string;
  }> = [];

  constructor(app: any, method: string, path: string) {
    this.app = app;
    this.method = method.toUpperCase();
    this.path = path;
  }

  set(field: string | Record<string, string>, val?: string): this {
    if (typeof field === 'string') {
      this.headers[field.toLowerCase()] = val ?? '';
    } else if (typeof field === 'object' && field !== null) {
      for (const [k, v] of Object.entries(field)) {
        this.headers[k.toLowerCase()] = String(v);
      }
    }
    return this;
  }

  field(name: string, value: any): this {
    this.formFields.push({ name, value: String(value) });
    return this;
  }

  attach(
    name: string,
    file: Buffer | string,
    optionsOrFilename?: string | { filename?: string; contentType?: string }
  ): this {
    let buffer: Buffer;
    let filename = 'file.bin';
    let contentType: string | undefined = undefined;

    if (Buffer.isBuffer(file)) {
      buffer = file;
    } else if (typeof file === 'string') {
      buffer = Buffer.from(file);
    } else {
      buffer = Buffer.alloc(0);
    }

    if (typeof optionsOrFilename === 'string') {
      filename = optionsOrFilename;
    } else if (optionsOrFilename && typeof optionsOrFilename === 'object') {
      if (optionsOrFilename.filename) filename = optionsOrFilename.filename;
      if (optionsOrFilename.contentType) contentType = optionsOrFilename.contentType;
    }

    this.formAttachments.push({
      name,
      buffer,
      filename,
      contentType
    });

    return this;
  }

  send(data?: any): this {
    this.bodyData = data;
    return this;
  }

  query(q: Record<string, any> | string): this {
    const qs = typeof q === 'string' ? q : new URLSearchParams(q).toString();
    if (qs) {
      this.path += (this.path.includes('?') ? '&' : '?') + qs;
    }
    return this;
  }

  expect(val: any): this {
    return this;
  }

  private buildMultipartBuffer(boundary: string): Buffer {
    const parts: Buffer[] = [];

    // Append regular text fields
    for (const field of this.formFields) {
      parts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="${field.name}"\r\n\r\n${field.value}\r\n`
        )
      );
    }

    // Append file attachments
    for (const file of this.formAttachments) {
      const ext = file.filename.split('.').pop()?.toLowerCase();
      let mime = file.contentType;
      if (!mime) {
        if (ext === 'pdf') mime = 'application/pdf';
        else if (ext === 'png') mime = 'image/png';
        else if (ext === 'jpg' || ext === 'jpeg') mime = 'image/jpeg';
        else if (ext === 'docx')
          mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        else mime = 'application/octet-stream';
      }

      const header = Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.name}"; filename="${file.filename}"\r\nContent-Type: ${mime}\r\n\r\n`
      );
      parts.push(header);
      parts.push(file.buffer);
      parts.push(Buffer.from('\r\n'));
    }

    // Final boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`));

    return Buffer.concat(parts);
  }

  private execute(): Promise<Response> {
    return new Promise((resolve, reject) => {
      try {
        const socket = new MockSocket();
        const req = new http.IncomingMessage(socket as any);
        req.method = this.method;
        req.url = this.path;

        let payloadBuffer: Buffer | null = null;

        if (this.formAttachments.length > 0 || this.formFields.length > 0) {
          const boundary = `----CarrerSyncFormBoundary${Date.now()}${Math.floor(Math.random() * 100000)}`;
          payloadBuffer = this.buildMultipartBuffer(boundary);
          this.headers['content-type'] = `multipart/form-data; boundary=${boundary}`;
          this.headers['content-length'] = String(payloadBuffer.length);
        } else if (this.bodyData !== undefined) {
          if (typeof this.bodyData === 'string') {
            payloadBuffer = Buffer.from(this.bodyData);
            if (!this.headers['content-type']) {
              this.headers['content-type'] = 'application/json';
            }
          } else if (Buffer.isBuffer(this.bodyData)) {
            payloadBuffer = this.bodyData;
          } else {
            payloadBuffer = Buffer.from(JSON.stringify(this.bodyData));
            if (!this.headers['content-type']) {
              this.headers['content-type'] = 'application/json';
            }
          }
          this.headers['content-length'] = String(payloadBuffer.length);
        }

        req.headers = {
          host: 'localhost',
          ...this.headers
        };

        const res = new http.ServerResponse(req);
        res.assignSocket(socket as any);

        let rawBody = '';
        let isDone = false;

        const origWrite = res.write;
        const origEnd = res.end;

        const completeResponse = () => {
          if (isDone) return;
          isDone = true;

          let parsedBody: any = {};
          try {
            parsedBody = rawBody ? JSON.parse(rawBody) : {};
          } catch {
            parsedBody = rawBody;
          }

          const responseHeaders = res.getHeaders();
          resolve({
            status: res.statusCode,
            statusCode: res.statusCode,
            body: parsedBody,
            text: rawBody,
            headers: responseHeaders,
            header: responseHeaders,
            ok: res.statusCode >= 200 && res.statusCode < 300
          });
        };

        res.write = function (chunk: any, encoding?: any, cb?: any) {
          if (chunk) {
            rawBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
          }
          return origWrite.call(this, chunk, encoding, cb);
        };

        res.end = function (chunk?: any, encoding?: any, cb?: any) {
          if (chunk && typeof chunk !== 'function') {
            rawBody += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
          }
          const ret = origEnd.call(this, chunk, encoding, cb);
          process.nextTick(completeResponse);
          return ret;
        };

        res.on('finish', completeResponse);
        res.on('error', (err) => {
          if (!isDone) {
            isDone = true;
            reject(err);
          }
        });

        // Dispatch to express app
        if (typeof this.app.handle === 'function') {
          this.app.handle(req, res);
        } else if (typeof this.app === 'function') {
          this.app(req, res);
        } else {
          throw new Error('Provided app is not a valid Express application');
        }

        process.nextTick(() => {
          if (payloadBuffer) {
            req.push(payloadBuffer);
          }
          req.push(null);
          (req as any).complete = true;
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  then<TResult1 = Response, TResult2 = never>(
    onfulfilled?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<Response | TResult> {
    return this.execute().catch(onrejected);
  }
}

export interface SuperTestClient {
  get(url: string): TestRequest;
  post(url: string): TestRequest;
  put(url: string): TestRequest;
  patch(url: string): TestRequest;
  delete(url: string): TestRequest;
  options(url: string): TestRequest;
  head(url: string): TestRequest;
}

export function request(app: any): SuperTestClient {
  return {
    get: (url: string) => new TestRequest(app, 'GET', url),
    post: (url: string) => new TestRequest(app, 'POST', url),
    put: (url: string) => new TestRequest(app, 'PUT', url),
    patch: (url: string) => new TestRequest(app, 'PATCH', url),
    delete: (url: string) => new TestRequest(app, 'DELETE', url),
    options: (url: string) => new TestRequest(app, 'OPTIONS', url),
    head: (url: string) => new TestRequest(app, 'HEAD', url)
  };
}

export default request;
