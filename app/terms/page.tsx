import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Eman Clinic",
  description:
    "Terms governing use of the Eman Clinic digital healthcare management platform.",
};

interface Section {
  id: string;
  title: string;
  body: React.ReactNode;
}

const sections: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: (
      <p>
        By accessing or using the <strong>Eman Clinic</strong> platform (the
        "Services") you agree to these Terms of Service (the "Terms"). If you
        use the Services on behalf of an organization, you represent that you
        have authority to bind that entity, and "you" includes that
        organization. If you do not agree, do not access or use the Services.
      </p>
    ),
  },
  {
    id: "definitions",
    title: "2. Key Definitions",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>"User"</strong> means any individual with an authenticated
          account (e.g. clinician, staff, admin).
        </li>
        <li>
          <strong>"Patient Data"</strong> means clinical or demographic
          information stored or processed for care delivery.
        </li>
        <li>
          <strong>"Content"</strong> includes text, data, files, reports,
          analytics, UI components, and configuration produced by the Services.
        </li>
        <li>
          <strong>"Authorized Role"</strong> refers to the mapped RBAC role
          (e.g. SUPER_ADMIN, NURSE, LABORATORIST, PHARMACIST).
        </li>
      </ul>
    ),
  },
  {
    id: "eligibility",
    title: "3. Eligibility & Account Security",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Accounts must be created through approved onboarding or administrative
          invitation.
        </li>
        <li>
          You are responsible for safeguarding credentials and enabling
          multi‑factor authentication where available.
        </li>
        <li>
          You must promptly notify us of suspected unauthorized access or
          account compromise.
        </li>
        <li>
          We may suspend or revoke access to protect system integrity or patient
          safety.
        </li>
      </ul>
    ),
  },
  {
    id: "license",
    title: "4. License & Permitted Use",
    body: (
      <p>
        We grant you a limited, non-exclusive, non-transferable, revocable
        license to use the Services solely for legitimate clinical,
        administrative, or operational purposes within your authorized role.
        Reverse engineering, scraping, automated bulk extraction, or derivative
        platform creation is prohibited except where explicitly permitted by
        applicable law that cannot be contractually waived.
      </p>
    ),
  },
  {
    id: "role-access",
    title: "5. Role-Based Access Control (RBAC)",
    body: (
      <p>
        Access to patient modules, inventory, reports, and billing features is
        governed by predefined roles. Users must not attempt to bypass or
        elevate privileges. Administrative users must regularly review and
        deactivate unused or inappropriate accounts.
      </p>
    ),
  },
  {
    id: "data-responsibility",
    title: "6. Patient Data Responsibility",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          You confirm you have lawful authority (consent, treatment mandate, or
          legal basis) to input or process Patient Data.
        </li>
        <li>
          You will not upload unrelated personal data or sensitive information
          beyond clinical necessity.
        </li>
        <li>
          You will respect minimum necessary and confidentiality principles.
        </li>
        <li>
          Exported data should be handled with equivalent safeguards once it
          leaves the platform.
        </li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "7. Payments & Billing (If Applicable)",
    body: (
      <p>
        Certain modules may require subscription or usage fees under a separate
        ordering document or plan selection. Unless otherwise stated: (a) fees
        are exclusive of taxes; (b) invoices are due within 30 days; (c) late
        amounts may incur lawful interest or suspension. Third‑party payment
        processors handle card data; we do not store full card numbers.
      </p>
    ),
  },
  {
    id: "availability",
    title: "8. Service Availability & Maintenance",
    body: (
      <p>
        We aim for high availability with reasonable scheduled maintenance
        windows announced in advance when practical. We may implement emergency
        maintenance (e.g. security patching) without prior notice. Features
        evolve over time; non‑material UI/UX changes do not constitute a breach.
      </p>
    ),
  },
  {
    id: "security",
    title: "9. Security & Acceptable Use",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          No introducing malware, probes, denial-of-service, or load testing
          without prior written consent.
        </li>
        <li>
          No sharing accounts or harvesting other users' data beyond intended
          workflows.
        </li>
        <li>
          We may log and audit access for compliance and forensic purposes.
        </li>
        <li>
          Reported vulnerabilities should be disclosed responsibly to our
          security contact.
        </li>
      </ul>
    ),
  },
  {
    id: "ip",
    title: "10. Intellectual Property",
    body: (
      <p>
        The platform (software code, design, trademarks, documentation) is owned
        or licensed by Eman Clinic. No IP rights transfer except limited use
        rights. Feedback, suggestions, or improvement ideas may be used by us
        without obligation, provided they do not include patient-identifiable
        data.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "11. Privacy & Data Protection",
    body: (
      <p>
        Processing of personal and Patient Data is governed by our{" "}
        <a href="/privacy" className="text-teal-600 hover:underline">
          Privacy Policy
        </a>
        . In case of conflict between these Terms and the Privacy Policy
        regarding data handling, the Privacy Policy prevails solely for that
        topic.
      </p>
    ),
  },
  {
    id: "warranties",
    title: "12. Disclaimers & Warranties",
    body: (
      <p>
        The Services are provided on an "AS IS" and "AS AVAILABLE" basis without
        warranties of uninterrupted operation, fitness for a particular purpose,
        or non‑infringement. Clinical judgment remains solely with licensed
        professionals. We do not provide medical diagnosis or treatment
        decisions; the platform is a facilitative tool.
      </p>
    ),
  },
  {
    id: "liability",
    title: "13. Limitation of Liability",
    body: (
      <p>
        To the maximum extent permitted by law, neither Eman Clinic nor its
        suppliers are liable for indirect, incidental, or consequential damages,
        loss of profits, lost data, or business interruption. Aggregate
        liability for direct damages will not exceed fees paid (if any) in the
        preceding 12 months. Some jurisdictions may not allow certain
        limitations; in such cases the limitation applies to the fullest extent
        allowed.
      </p>
    ),
  },
  {
    id: "indemnity",
    title: "14. Indemnification",
    body: (
      <p>
        You agree to defend and indemnify Eman Clinic against claims arising
        from: (a) misuse of the Services; (b) breach of these Terms; (c)
        violation of law or third-party rights; (d) unauthorized disclosure or
        mishandling of Patient Data attributable to your actions.
      </p>
    ),
  },
  {
    id: "termination",
    title: "15. Suspension & Termination",
    body: (
      <p>
        We may suspend or terminate access immediately for material breach,
        security risk, suspected fraud, or legal compliance reasons. You may
        terminate by discontinuing use. Certain clauses (IP, limitation of
        liability, indemnity, dispute resolution) survive termination.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "16. Governing Law & Venue",
    body: (
      <p>
        These Terms are governed by applicable local laws where the contracting
        entity is established, without regard to conflict of law rules. Disputes
        will be resolved in the competent courts of that jurisdiction, unless
        mandatory healthcare or data protection tribunals apply.
      </p>
    ),
  },
  {
    id: "changes",
    title: "17. Changes to Terms",
    body: (
      <p>
        We may modify these Terms for legitimate business, legal, or security
        reasons. Material changes will be signaled via in‑app notice or email.
        Continued use after effective date constitutes acceptance. If you
        object, discontinue use before the new Terms apply.
      </p>
    ),
  },
  {
    id: "contact",
    title: "18. Contact",
    body: (
      <p>
        Questions about these Terms may be directed to{" "}
        <a
          href="mailto:legal@emanclinic.example"
          className="text-teal-600 hover:underline"
        >
          legal@emanclinic.example
        </a>{" "}
        (replace with operational address).
      </p>
    ),
  },
];

export default function TermsPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-12 space-y-10 min-h-screen bg-background text-text-primary transition-colors duration-200">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-text-secondary">
          Last Updated: {lastUpdated}
        </p>
        <p className="text-base text-text-secondary max-w-3xl leading-relaxed">
          These Terms define the conditions under which you may access and use
          the Eman Clinic platform and related services.
        </p>
      </header>
      <nav aria-label="On-page navigation">
        <ul className="flex flex-wrap gap-3 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="text-accent-color hover:underline focus:outline-none rounded-sm"
              >
                {s.title.replace(/^[0-9]+\.\s/, "")}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="space-y-12">
        {sections.map((section) => (
          <section key={section.id} id={section.id} className="scroll-mt-28">
            <h2 className="text-xl md:text-2xl font-semibold mb-4 text-text-primary">
              {section.title}
            </h2>
            <div className="prose prose-sm md:prose-base max-w-none leading-relaxed prose-headings:text-text-primary prose-p:text-text-secondary prose-li:text-text-secondary dark:prose-invert">
              {section.body}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
