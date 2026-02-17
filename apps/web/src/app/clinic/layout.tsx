export default function ClinicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: `
          radial-gradient(
            1200px 600px at 90% 10%,
            rgba(231, 101, 101, 0.12),
            transparent 60%
          ),
          #f8f8fa
        `,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 16,
        }}
      >
        {children}
      </div>
    </div>
  );
}
