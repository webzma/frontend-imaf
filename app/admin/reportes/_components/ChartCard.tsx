export function ChartCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-sm bg-surface-container-lowest p-6 ambient-shadow ${className ?? ""}`}
    >
      <div className="mb-5">
        <h2 className="font-serif text-xl font-light tight-tracking text-on-surface">
          {title}
        </h2>
        {description && (
          <p className="mt-0.5 font-sans text-xs text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  );
}
