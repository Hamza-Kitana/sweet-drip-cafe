import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — Sweet Drip" }] }),
  component: () => (
    <div className="section-inner py-16 max-w-3xl mx-auto prose-content">
      <h1 className="text-4xl font-display text-primary mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground mb-6">This Privacy Policy explains how Sweet Drip Dessert Cafe ("we", "us", or "our") collects and uses information when you visit our website.</p>
      <H>Information We Collect</H>
      <P>We use the TikTok Pixel to gather data about how visitors interact with our site. This tool collects information such as page views, clicks, conversions and your IP address. The data helps us understand the effectiveness of our advertising and improve user experience.</P>
      <H>How We Use the Data</H>
      <P>Information collected through the TikTok Pixel may be shared with TikTok and used to optimize our marketing campaigns. We do not sell your personal information. Data is retained only for as long as necessary to fulfill these purposes or to comply with legal obligations.</P>
      <H>Your Choices</H>
      <P>You may adjust your browser settings to manage cookies or opt out of targeted advertising through your TikTok account settings.</P>
    </div>
  ),
});
const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-display text-primary mt-8 mb-3">{children}</h2>;
const P = ({ children }: { children: React.ReactNode }) => <p className="text-muted-foreground leading-relaxed">{children}</p>;