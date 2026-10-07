export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="bp-platform-shell">{children}</div>;
}
