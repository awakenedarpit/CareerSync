/**
 * CarrerSync Profile Completeness Utility
 * Computes profile completeness score, category breakdown, and action items.
 */

export function calculateProfileCompleteness(profile) {
  if (!profile) {
    return {
      score: 0,
      breakdown: {
        personal: { label: 'Personal Information', score: 0, max: 20 },
        contact: { label: 'Contact Details', score: 0, max: 15 },
        professionalLinks: { label: 'Professional Links', score: 0, max: 25 },
        academic: { label: 'Academic Records', score: 0, max: 20 },
        preferences: { label: 'Career Preferences', score: 0, max: 20 },
      },
      suggestions: [
        { category: 'Personal', text: 'Fill in your personal profile and career bio.' },
        { category: 'Links', text: 'Connect your GitHub and LinkedIn profiles.' },
        { category: 'Preferences', text: 'Select your target job roles and work locations.' }
      ]
    };
  }

  const breakdown = {
    personal: { label: 'Personal Information', score: 0, max: 20 },
    contact: { label: 'Contact Details', score: 0, max: 15 },
    professionalLinks: { label: 'Professional Links', score: 0, max: 25 },
    academic: { label: 'Academic Records', score: 0, max: 20 },
    preferences: { label: 'Career Preferences', score: 0, max: 20 },
  };

  const suggestions = [];

  // Personal Info (20 max)
  if (profile.bio && profile.bio.trim().length >= 15) {
    breakdown.personal.score += 6;
  } else {
    suggestions.push({ category: 'Personal', text: 'Add a career summary / professional bio' });
  }

  if (profile.careerObjective && profile.careerObjective.trim().length >= 10) {
    breakdown.personal.score += 5;
  } else {
    suggestions.push({ category: 'Personal', text: 'Add a career objective to guide recruiter matchmaking' });
  }

  if (profile.avatarUrl && profile.avatarUrl.trim().length > 5) {
    breakdown.personal.score += 5;
  } else {
    suggestions.push({ category: 'Personal', text: 'Add a profile avatar or headshot URL' });
  }

  if (profile.currentCity && profile.currentCity.trim().length > 1) {
    breakdown.personal.score += 4;
  } else {
    suggestions.push({ category: 'Personal', text: 'Set your current city and location' });
  }

  // Contact Info (15 max)
  if (profile.phoneNumber && profile.phoneNumber.trim().length >= 10) {
    breakdown.contact.score += 7;
  } else {
    suggestions.push({ category: 'Contact', text: 'Add your primary phone number' });
  }

  if (profile.personalEmail && profile.personalEmail.includes('@')) {
    breakdown.contact.score += 5;
  } else {
    suggestions.push({ category: 'Contact', text: 'Add an alternate personal email address' });
  }

  if (profile.preferredContactMethod) {
    breakdown.contact.score += 3;
  }

  // Professional & Social Links (25 max)
  if (profile.githubUrl && profile.githubUrl.trim().length > 5) {
    breakdown.professionalLinks.score += 8;
  } else {
    suggestions.push({ category: 'Links', text: 'Add your GitHub profile to showcase code evidence' });
  }

  if (profile.linkedinUrl && profile.linkedinUrl.trim().length > 5) {
    breakdown.professionalLinks.score += 7;
  } else {
    suggestions.push({ category: 'Links', text: 'Add your LinkedIn profile URL' });
  }

  if (profile.portfolioUrl || profile.personalWebsiteUrl) {
    breakdown.professionalLinks.score += 5;
  } else {
    suggestions.push({ category: 'Links', text: 'Link your portfolio or personal website' });
  }

  const hasCodingProfile =
    (profile.leetcodeUrl && profile.leetcodeUrl.trim().length > 5) ||
    (profile.hackerrankUrl && profile.hackerrankUrl.trim().length > 5) ||
    (profile.codeforcesUrl && profile.codeforcesUrl.trim().length > 5) ||
    (profile.codechefUrl && profile.codechefUrl.trim().length > 5) ||
    (profile.kaggleUrl && profile.kaggleUrl.trim().length > 5) ||
    (profile.geeksforgeeksUrl && profile.geeksforgeeksUrl.trim().length > 5);

  if (hasCodingProfile) {
    breakdown.professionalLinks.score += 5;
  } else {
    suggestions.push({ category: 'Links', text: 'Connect a coding platform profile (LeetCode, HackerRank, etc.)' });
  }

  // Academic Records (20 max)
  if (profile.department) breakdown.academic.score += 6;
  if (profile.cgpa && Number(profile.cgpa) > 0) breakdown.academic.score += 8;
  if (profile.batchYear) breakdown.academic.score += 6;

  // Preferences & Privacy (20 max)
  const targetRoles = Array.isArray(profile.targetJobRoles) ? profile.targetJobRoles : [];
  if (targetRoles.length > 0) {
    breakdown.preferences.score += 7;
  } else {
    suggestions.push({ category: 'Preferences', text: 'Select target job roles for placement matching' });
  }

  const locations = Array.isArray(profile.preferredLocations) ? profile.preferredLocations : [];
  if (locations.length > 0) {
    breakdown.preferences.score += 5;
  } else {
    suggestions.push({ category: 'Preferences', text: 'Set your preferred job locations (e.g. Remote, Bangalore)' });
  }

  const industries = Array.isArray(profile.preferredIndustries) ? profile.preferredIndustries : [];
  if (industries.length > 0) {
    breakdown.preferences.score += 4;
  } else {
    suggestions.push({ category: 'Preferences', text: 'Select preferred industry sectors' });
  }

  const empTypes = Array.isArray(profile.preferredEmploymentTypes) ? profile.preferredEmploymentTypes : [];
  if (empTypes.length > 0) {
    breakdown.preferences.score += 4;
  }

  const totalScore = Math.min(
    100,
    breakdown.personal.score +
    breakdown.contact.score +
    breakdown.professionalLinks.score +
    breakdown.academic.score +
    breakdown.preferences.score
  );

  return {
    score: totalScore,
    breakdown,
    suggestions: suggestions.slice(0, 5),
  };
}
