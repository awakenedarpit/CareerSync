import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  AlertTriangle,
  Save,
  CheckCircle2,
  Globe
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';

export default function Settings() {
  const [platformConfig, setPlatformConfig] = useState({
    platformName: 'CarrerSync Agentic Placement Intelligence',
    supportEmail: 'ops@carrersync.io',
    allowedDomains: '*.edu, *.ac.in, *.edu.in',
    defaultStorageQuotaGb: '50'
  });

  const [securityPolicies, setSecurityPolicies] = useState({
    enforceMfaAdmins: true,
    sessionTimeoutMinutes: '30',
    maxFailedAttempts: '5',
    passwordComplexity: 'high',
    ipWhitelistEnabled: false
  });

  const [tokenExpiry, setTokenExpiry] = useState({
    invitationExpiryDays: '7',
    passwordResetHours: '2',
    jwtAccessMinutes: '15',
    refreshTokenDays: '30'
  });

  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: 'System undergoing scheduled database partition maintenance. We will return shortly.',
    allowSuperAdminBypass: true,
    emergencyLockdown: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {saveSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom">
          <CheckCircle2 className="h-4 w-4" />
          <span>Platform policies and security parameters updated across all nodes.</span>
        </div>
      )}

      <PageHeader
        title="Super Admin Platform Settings"
        subtitle="Universal configuration, enterprise security policies, token lifetimes, and maintenance control."
        breadcrumbs={[{ label: 'Super Admin', href: '/super-admin' }, { label: 'Settings' }]}
        action={
          <Button onClick={handleSave} variant="primary" size="sm" disabled={isSaving}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Applying Changes...' : 'Save Configuration'}
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Platform Configuration */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Globe className="h-4 w-4 text-indigo-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Platform Identification & Limits</h3>
              <p className="text-xs text-slate-500">Core parameters defining the multi-institution environment.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Input
              label="Global Platform Name"
              value={platformConfig.platformName}
              onChange={(e) => setPlatformConfig({ ...platformConfig, platformName: e.target.value })}
              required
            />

            <Input
              label="Global Support & Governance Email"
              type="email"
              value={platformConfig.supportEmail}
              onChange={(e) => setPlatformConfig({ ...platformConfig, supportEmail: e.target.value })}
              required
            />

            <Input
              label="Permitted Institutional Domain Regex / Wildcard"
              value={platformConfig.allowedDomains}
              onChange={(e) => setPlatformConfig({ ...platformConfig, allowedDomains: e.target.value })}
              helperText="Restricts eligible domain suffixes for university registration."
              required
            />

            <Input
              label="Default Storage Quota per Institution (GB)"
              type="number"
              value={platformConfig.defaultStorageQuotaGb}
              onChange={(e) => setPlatformConfig({ ...platformConfig, defaultStorageQuotaGb: e.target.value })}
              helperText="Evidence artifacts, student resumes, and audit archives."
              required
            />
          </div>
        </Card>

        {/* Section 2: Security & Authentication Policies */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <Shield className="h-4 w-4 text-purple-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Security & Access Policies</h3>
              <p className="text-xs text-slate-500">Authentication constraints, MFA enforcement, and session limits.</p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-start justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <p className="text-xs font-bold text-slate-900">Enforce Multi-Factor Authentication (MFA)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mandatory TOTP authenticator setup for all College Admins, TPO Admins, and Super Administrators.
                </p>
              </div>
              <input
                type="checkbox"
                checked={securityPolicies.enforceMfaAdmins}
                onChange={(e) => setSecurityPolicies({ ...securityPolicies, enforceMfaAdmins: e.target.checked })}
                className="h-5 w-5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Admin Session Timeout (Minutes)"
                type="number"
                value={securityPolicies.sessionTimeoutMinutes}
                onChange={(e) => setSecurityPolicies({ ...securityPolicies, sessionTimeoutMinutes: e.target.value })}
                required
              />

              <Input
                label="Max Failed Logins Before Lockout"
                type="number"
                value={securityPolicies.maxFailedAttempts}
                onChange={(e) => setSecurityPolicies({ ...securityPolicies, maxFailedAttempts: e.target.value })}
                required
              />

              <Select
                label="Password Policy Strength"
                value={securityPolicies.passwordComplexity}
                onChange={(e) => setSecurityPolicies({ ...securityPolicies, passwordComplexity: e.target.value })}
                options={[
                  { value: 'standard', label: 'Standard (8+ chars, 1 number)' },
                  { value: 'high', label: 'High (10+ chars, uppercase, symbol)' },
                  { value: 'maximum', label: 'Maximum (14+ chars, full entropy)' }
                ]}
                required
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Token Expiry Lifetimes */}
        <Card>
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
            <KeyRound className="h-4 w-4 text-amber-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Cryptographic Token Lifetimes</h3>
              <p className="text-xs text-slate-500">TTL settings for invitations, reset tokens, and API JWTs.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
            <Input
              label="Invitation Expiry (Days)"
              type="number"
              value={tokenExpiry.invitationExpiryDays}
              onChange={(e) => setTokenExpiry({ ...tokenExpiry, invitationExpiryDays: e.target.value })}
              required
            />

            <Input
              label="Password Reset (Hours)"
              type="number"
              value={tokenExpiry.passwordResetHours}
              onChange={(e) => setTokenExpiry({ ...tokenExpiry, passwordResetHours: e.target.value })}
              required
            />

            <Input
              label="JWT Access Token (Mins)"
              type="number"
              value={tokenExpiry.jwtAccessMinutes}
              onChange={(e) => setTokenExpiry({ ...tokenExpiry, jwtAccessMinutes: e.target.value })}
              required
            />

            <Input
              label="Refresh Token (Days)"
              type="number"
              value={tokenExpiry.refreshTokenDays}
              onChange={(e) => setTokenExpiry({ ...tokenExpiry, refreshTokenDays: e.target.value })}
              required
            />
          </div>
        </Card>

        {/* Section 4: Maintenance Mode & Emergency Controls */}
        <Card className="border-rose-200">
          <div className="flex items-center gap-2 pb-4 border-b border-rose-100">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Platform Maintenance & Emergency Controls</h3>
              <p className="text-xs text-slate-500">Global traffic routing, maintenance banners, and lockdown procedures.</p>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <div className="flex items-start justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
              <div>
                <p className="text-xs font-bold text-slate-900">Activate Platform Maintenance Mode</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  When active, public and student access will be suspended and replaced with the broadcast message below.
                </p>
              </div>
              <input
                type="checkbox"
                checked={maintenance.enabled}
                onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
                className="h-5 w-5 rounded text-rose-600 border-rose-300 focus:ring-rose-500 cursor-pointer"
              />
            </div>

            <Input
              label="Maintenance Broadcast Message"
              value={maintenance.message}
              onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
              disabled={!maintenance.enabled}
              helperText="Rendered in full-page banner to non-superadmin visitors."
            />

            <div className="flex items-center gap-3">
              <input
                id="bypassSuper"
                type="checkbox"
                checked={maintenance.allowSuperAdminBypass}
                onChange={(e) => setMaintenance({ ...maintenance, allowSuperAdminBypass: e.target.checked })}
                className="h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
              />
              <label htmlFor="bypassSuper" className="text-xs text-slate-700 font-medium select-none">
                Permit Super Administrators to bypass maintenance gate
              </label>
            </div>

            <div className="pt-3 border-t border-rose-100 flex items-start gap-3 bg-red-50 p-3 rounded-xl border border-red-200 text-red-900">
              <input
                id="emergencyLockdown"
                type="checkbox"
                checked={maintenance.emergencyLockdown}
                onChange={(e) => setMaintenance({ ...maintenance, emergencyLockdown: e.target.checked })}
                className="mt-0.5 h-4 w-4 rounded text-red-600 border-red-300 focus:ring-red-500"
              />
              <div>
                <label htmlFor="emergencyLockdown" className="text-xs font-bold select-none cursor-pointer">
                  Emergency System Lockdown (Zero Trust Kill-Switch)
                </label>
                <p className="text-[11px] text-red-700 mt-0.5">
                  Immediately revokes all active JWT sessions across every tenant, freezes database mutations, and restricts access strictly to hardware security keys.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" variant="primary" size="md" disabled={isSaving}>
            <Save className="h-4 w-4 mr-1.5" />
            {isSaving ? 'Saving Platform Changes...' : 'Save All Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
