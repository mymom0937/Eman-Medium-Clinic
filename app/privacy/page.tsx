import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Eman Clinic",
  description:
    "How Eman Clinic collects, uses, safeguards and shares patient and user information.",
};

const sections: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: "overview",
    title: "1. Overview",
    body: (
      <p>
        This Privacy Policy explains how <strong>Eman Clinic</strong> ("Eman
        Clinic", "we", "our", or "us") collects, uses, discloses, and safeguards
        personal, health, and usage information when you access our digital
        clinic platform, related mobile or web interfaces, and connected
        services (collectively, the "Services"). We are committed to protecting
        confidentiality, integrity, and lawful processing of healthcare data.
      </p>
    ),
  },
  {
    id: "scope",
    title: "2. Scope & Regulatory Alignment",
    body: (
      <p>
        This Policy applies to all users including patients, clinicians,
        administrative staff, and third-party integrators. We apply principles
        consistent with internationally recognized health data standards (e.g.
        confidentiality, minimum necessary use, purpose limitation,
        security-by-design). Where local law imposes stricter requirements,
        those obligations prevail.
      </p>
    ),
  },
  {
    id: "data-we-collect",
    title: "3. Information We Collect",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Identity Data:</strong> name, date of birth, gender,
          identifiers issued by us or your organization.
        </li>
        <li>
          <strong>Contact Data:</strong> email, phone, address, emergency
          contact (if provided).
        </li>
        <li>
          <strong>Clinical / Patient Data:</strong> visit notes, lab
          orders/results, medications, allergies, services rendered, billing
          codes.
        </li>
        <li>
          <strong>Account & Authentication:</strong> role, permissions, audit
          trail entries, session tokens.
        </li>
        <li>
          <strong>Financial Data:</strong> limited payment metadata (we do not
          store full card numbers if processed by a PCI compliant processor).
        </li>
        <li>
          <strong>Usage & Technical:</strong> device type, browser, IP address,
          timestamps, feature interaction, error logs (pseudonymized when
          feasible).
        </li>
        <li>
          <strong>Optional Feedback:</strong> survey responses, support tickets,
          feature requests.
        </li>
      </ul>
    ),
  },
  {
    id: "how-we-use",
    title: "4. How We Use Information",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Deliver core clinic workflows (scheduling, charting, medication /
          inventory management, reporting).
        </li>
        <li>
          Authenticate users; enforce role-based access control (RBAC) and
          auditability.
        </li>
        <li>
          Generate internal analytics to improve reliability, quality of care
          tooling, and user experience (aggregated / de‑identified whenever
          possible).
        </li>
        <li>
          Provide patient safety alerts (drug interactions, abnormal results)
          where supported.
        </li>
        <li>Detect, investigate, and prevent security incidents or misuse.</li>
        <li>
          Comply with legal, accreditation, or regulatory obligations and
          respond to lawful requests.
        </li>
        <li>Communicate service notices, updates, and support responses.</li>
      </ul>
    ),
  },
  {
    id: "lawful-bases",
    title: "5. Legal / Lawful Bases",
    body: (
      <p>
        We process data under one or more of: (a) performance of a healthcare or
        service provision contract; (b) legitimate interests in operating and
        securing the platform (balanced against user rights); (c) explicit
        consent where required (e.g. optional marketing); (d) compliance with
        legal obligations; (e) protection of vital interests in emergent
        scenarios.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "6. Disclosure & Sharing",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Authorized Clinical Personnel:</strong> Access controlled by
          role and least-privilege.
        </li>
        <li>
          <strong>Service Providers:</strong> Hosting, email delivery,
          analytics, secure payment processors—bound by confidentiality and data
          processing agreements.
        </li>
        <li>
          <strong>Regulators / Legal:</strong> If required by applicable law,
          court order, or to protect rights, safety, or system integrity.
        </li>
        <li>
          <strong>Research & Analytics:</strong> Only aggregated or
          de‑identified outputs unless explicit consent or lawful basis permits
          otherwise.
        </li>
        <li>
          <strong>Business Continuity:</strong> In a merger or acquisition,
          subject to equivalent safeguards and notice.
        </li>
      </ul>
    ),
  },
  {
    id: "transfers",
    title: "7. International / Cross-Border Handling",
    body: (
      <p>
        Data may be processed in jurisdictions where our infrastructure or
        vetted subcontractors operate. We implement logical isolation,
        encryption in transit & at rest, strict access logging, and contractual
        clauses where required to maintain comparable protection levels.
      </p>
    ),
  },
  {
    id: "retention",
    title: "8. Retention",
    body: (
      <p>
        We retain personal and clinical data only for the duration necessary to
        deliver Services, meet clinical recordkeeping obligations, resolve
        disputes, and enforce agreements. When no longer required, we securely
        delete or irreversibly de‑identify data using industry-standard
        procedures.
      </p>
    ),
  },
  {
    id: "security",
    title: "9. Security Controls",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Encryption (TLS in transit, encrypted storage for sensitive records).
        </li>
        <li>
          Role-based access, multi-factor authentication support, and session
          timeouts.
        </li>
        <li>Audit logging of privileged actions and data access pathways.</li>
        <li>
          Segregated environments (production vs. test) and principle of least
          privilege.
        </li>
        <li>
          Routine vulnerability scanning and secure development lifecycle
          practices.
        </li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "10. User & Patient Rights",
    body: (
      <ul className="list-disc pl-5 space-y-2">
        <li>
          Access / obtain a copy of your data within reasonable system
          capabilities.
        </li>
        <li>Request correction of inaccurate information.</li>
        <li>
          Request deletion where retention is not legally or clinically
          mandated.
        </li>
        <li>
          Object or restrict certain processing (e.g. analytics) where legally
          permitted.
        </li>
        <li>
          Portability of certain structured data (on request and feasibility).
        </li>
        <li>Withdraw consent for optional communications.</li>
      </ul>
    ),
  },
  {
    id: "children",
    title: "11. Children & Vulnerable Persons",
    body: (
      <p>
        Accounts for minors or vulnerable patients are created and managed only
        by authorized clinical or guardian stakeholders consistent with
        applicable law. We do not intentionally market Services directly to
        minors.
      </p>
    ),
  },
  {
    id: "changes",
    title: "12. Policy Updates",
    body: (
      <p>
        We may revise this Policy to reflect regulatory, technical, or
        operational changes. The “Last Updated” date will change accordingly.
        Material updates may be communicated via dashboard notice, email, or
        in‑app banner. Continued use after the effective date constitutes
        acceptance.
      </p>
    ),
  },
  {
    id: "contact",
    title: "13. Contact",
    body: (
      <p>
        Questions, data requests, or escalation of privacy concerns can be
        directed to:{" "}
        <a
          href="mailto:privacy@emanclinic.example"
          className="text-teal-600 hover:underline"
        >
          privacy@emanclinic.example
        </a>{" "}
        (replace with operational address). We aim to acknowledge inquiries
        within 5 business days.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <main className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-12 space-y-10 min-h-screen bg-background text-text-primary transition-colors duration-200">
      <header className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-text-secondary">
          Last Updated: {lastUpdated}
        </p>
        <p className="text-base text-text-secondary max-w-3xl leading-relaxed">
          Your trust matters. This document describes how we handle information
          across the Eman Clinic platform with an emphasis on confidentiality,
          patient safety, and responsible technology.
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
