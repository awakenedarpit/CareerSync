import React, { useState } from 'react';
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Save,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

export default function CompanyProfile() {
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({
    companyName: 'Google',
    industry: 'Technology & Cloud Infrastructure',
    website: 'https://careers.google.com',
    headquarters: 'Mountain View, CA (India HQ: Bengaluru)',
    techStack: 'C++, Go, Java, Python, TypeScript, Distributed Systems',
    recruiterName: 'Sarah Jenkins',
    email: 'sarah.j@google.com',
    about: 'Google is a global technology leader focused on improving the ways people connect with information.'
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruiter Corporate Profile"
        subtitle="Manage your company details, hiring criteria, and institutional liaison contacts."
        breadcrumbs={[{ label: 'Recruiter', href: '/recruiter' }, { label: 'Company Profile' }]}
        action={
          <Button onClick={handleSave} variant="primary" size="sm">
            <Save className="h-4 w-4 mr-1.5" />
            Save Profile
          </Button>
        }
      />

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>Company profile updated successfully.</span>
        </div>
      )}

      <Card className="p-6 border-slate-200">
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Company Name"
              value={profile.companyName}
              onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
            />
            <Input
              label="Industry Sector"
              value={profile.industry}
              onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
            />
            <Input
              label="Careers Website URL"
              value={profile.website}
              onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            />
            <Input
              label="Office Location(s)"
              value={profile.headquarters}
              onChange={(e) => setProfile({ ...profile, headquarters: e.target.value })}
            />
            <Input
              label="Primary Tech Stacks"
              value={profile.techStack}
              onChange={(e) => setProfile({ ...profile, techStack: e.target.value })}
            />
            <Input
              label="Lead Recruiter Email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">About the Organization</label>
            <textarea
              rows={3}
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-[#02E8A7] focus:outline-hidden"
            />
          </div>
        </form>
      </Card>
    </div>
  );
}
