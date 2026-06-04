import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — Sweet Drip" }] }),
  component: () => (
    <div className="section-inner py-16 max-w-3xl mx-auto">
      <h1 className="text-4xl font-display text-primary mb-6">Terms & Conditions</h1>
      <p className="text-muted-foreground mb-6">By accessing or using the Sweet Drip Dessert Cafe website, you agree to be bound by these terms. If you do not agree, please do not use our site.</p>
      <H>Use of Our Site</H>
      <P>All content on this site is provided for informational purposes. We reserve the right to modify the site and these terms at any time.</P>
      <H>Intellectual Property</H>
      <P>All logos, text and graphics are the property of Sweet Drip Dessert Cafe unless otherwise noted. Unauthorized use is prohibited.</P>
      <H>Limitation of Liability</H>
      <P>Sweet Drip Dessert Cafe is not liable for any damages arising from the use of this website. Your use of the site is at your own risk.</P>
    </div>
  ),
});
const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-display text-primary mt-8 mb-3">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-muted-foreground leading-relaxed">{children}</p>;