import React, { useState } from 'react';
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Phone,
  User,
  CheckCircle2,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function CreateCollege() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    domain: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    adminDesignation: 'Director of Training & Placement',
    sendInvitation: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const handleNameChange = (e) => {
    const name = e.target.value;
    // Auto-generate slug and guess domain if empty
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug === '' || prev.slug === prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') ? generatedSlug : prev.slug
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessResult({
        name: formData.name,
        slug: formData.slug,
        domain: formData.domain,
        location: formData.location,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        invitationToken: `cs_inv_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`
      });
    }, 600);
  };

  if (successResult) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <PageHeader
          title="Institution Provisioned Successfully"
          subtitle="The college tenant and initial administrator account have been initialized."
          breadcrumbs={[
            { label: 'Super Admin', href: '/super-admin' },
            { label: 'Colleges', href: '/super-admin/colleges' },
            { label: 'Provisioned' }
          ]}
        />

        <Card className="border-emerald-200 bg-emerald-50/40 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-2xl shrink-0">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">
                {successResult.name} is now live!
              </h3>
              <p className="text-sm text-slate-600">
                Multi-tenant database schema partitions and tenant isolation barriers have been configured.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-emerald-200/60 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Tenant Identifier (Slug)</span>
              <p className="text-slate-900 font-mono font-bold text-sm mt-0.5">{successResult.slug}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Official Domain</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{successResult.domain}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Lead Administrator</span>
              <p className="text-slate-900 font-bold text-sm mt-0.5">{successResult.adminName}</p>
              <p className="text-slate-500 font-mono mt-0.5">{successResult.adminEmail}</p>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-100">
              <span className="text-slate-400 font-semibold uppercase">Activation Token</span>
              <p className="text-[#009669] font-mono font-bold text-xs truncate mt-0.5">{successResult.invitationToken}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button to="/super-admin/colleges" variant="primary" size="md">
              Back to Colleges
            </Button>
            <Button
              onClick={() => {
                setSuccessResult(null);
                setFormData({
                  name: '',
                  slug: '',
                  domain: '',
                  location: '',
                  contactEmail: '',
                  contactPhone: '',
                  adminName: '',
                  adminEmail: '',
                  adminPhone: '',
                  adminDesignation: 'Director of Training & Placement',
                  sendInvitation: true
                });
              }}
              variant="secondary"
              size="md"
            >
              Register Another College
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Register New College Institution"
        subtitle="Provision a dedicated institution tenant, configure official email domains, and appoint the primary administrator."
        breadcrumbs={[
          { label: 'Super Admin', href: '/super-admin' },
          { label: 'Colleges', href: '/super-admin/colleges' },
          { label: 'Register College' }
        ]}
        action={
          <Button to="/super-admin/colleges" variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Cancel & Return
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Institutional Profile */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Building2 className="h-5 w-5 text-[#009669]" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Institutional Profile & Domain</h3>
              <p className="text-xs text-slate-500">Core parameters defining the tenant boundary.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="sm:col-span-2">
              <Input
                label="Full Official College Name"
                placeholder="e.g. Stanford Institute of Technology"
                value={formData.name}
                onChange={handleNameChange}
                required
              />
            </div>

            <Input
              label="Tenant Slug / Identifier"
              placeholder="e.g. sit-blr"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              helperText="Lowercase alphanumeric, used in routing and DB isolation."
              required
            />

            <Input
              label="Official Domain"
              placeholder="e.g. sit.edu.in"
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              icon={Globe}
              helperText="Only emails ending with this domain can claim student/admin accounts."
              required
            />

            <div className="sm:col-span-2">
              <Input
                label="Campus Location / City"
                placeholder="e.g. Bengaluru, Karnataka, India"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                icon={MapPin}
                required
              />
            </div>

            <Input
              label="Official Contact Email"
              type="email"
              placeholder="e.g. info@sit.edu.in"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              icon={Mail}
              required
            />

            <Input
              label="Official Contact Phone"
              placeholder="e.g. +91 80 4123 4567"
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              icon={Phone}
              required
            />
          </div>
        </Card>

        {/* Section 2: Initial College Administrator */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <User className="h-5 w-5 text-[#009669]" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Initial Institutional Administrator</h3>
              <p className="text-xs text-slate-500">The primary administrative authority who manages T&P staff and drives.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Administrator Full Name"
              placeholder="e.g. Dr. Ramesh Chander"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              required
            />

            <Input
              label="Administrator Email (Institutional)"
              type="email"
              placeholder="e.g. head.placement@sit.edu.in"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />

            <Input
              label="Administrator Phone"
              placeholder="e.g. +91 98765 43210"
              value={formData.adminPhone}
              onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
            />

            <Input
              label="Designation / Title"
              placeholder="e.g. Head of Training & Placement"
              value={formData.adminDesignation}
              onChange={(e) => setFormData({ ...formData, adminDesignation: e.target.value })}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                id="sendInvitation"
                type="checkbox"
                checked={formData.sendInvitation}
                onChange={(e) => setFormData({ ...formData, sendInvitation: e.target.checked })}
                className="h-4 w-4 text-[#009669] rounded border-slate-300 focus:ring-[#02E8A7]"
              />
              <label htmlFor="sendInvitation" className="text-xs text-slate-700 font-medium select-none">
                Dispatch cryptographic invitation email with one-time onboarding link to this administrator
              </label>
            </div>
          </div>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button to="/super-admin/colleges" variant="secondary" size="md">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Provisioning Tenant...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4" />
                Provision College & Issue Invitation
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
