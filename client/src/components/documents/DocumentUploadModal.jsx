import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import Select from '../ui/Select';
import fileService from '../../services/fileService';

const DOCUMENT_CATEGORIES = [
  { value: 'resume', label: 'Student Resume (PDF, DOCX)' },
  { value: 'academic_certificate', label: 'Academic Transcript / Certificate' },
  { value: 'technical_certificate', label: 'Technical / Professional Certificate' },
  { value: 'project_evidence', label: 'Project Evidence / Code Proof' },
  { value: 'portfolio_attachment', label: 'Portfolio / Design Attachment' },
  { value: 'placement_document', label: 'Placement Eligibility Document' }
];

export default function DocumentUploadModal({ isOpen, onClose, onSuccess, initialType = 'resume' }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState(initialType);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5 MB maximum limit.');
      return;
    }

    const validExtensions = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setError('Unsupported file type. Please upload a PDF, PNG, JPEG, or DOCX document.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await fileService.uploadFile(selectedFile, documentType, (p) => {
        setProgress(p);
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(result.document);
        handleClose();
      }, 1000);
    } catch (err) {
      setError(err.message || 'File upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setProgress(0);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#BDF9F9]/30 text-[#009669] rounded-lg">
              <UploadCloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Upload Document</h3>
              <p className="text-[11px] text-slate-500">Secure, encrypted institutional file vault</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          <Select
            label="Document Category"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            options={DOCUMENT_CATEGORIES}
            disabled={uploading}
          />

          {/* Drag & Drop Area */}
          <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
            <input
              type="file"
              onChange={handleFileChange}
              disabled={uploading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              accept=".pdf,.png,.jpg,.jpeg,.docx"
            />
            <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
              <div className="p-3 bg-white rounded-full shadow-xs border border-slate-100 text-[#009669]">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="text-xs font-semibold text-slate-700">
                {selectedFile ? selectedFile.name : 'Click to browse or drag file here'}
              </p>
              <p className="text-[10px] text-slate-400">PDF, PNG, JPEG, DOCX up to 5 MB</p>
            </div>
          </div>

          {selectedFile && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-700">
              <div className="flex items-center gap-2 truncate">
                <FileText className="h-4 w-4 text-[#009669] shrink-0" />
                <span className="truncate font-medium">{selectedFile.name}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0 ml-2">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#02E8A7] h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>File securely uploaded and verified!</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="outline" size="sm" onClick={handleClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Document'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
