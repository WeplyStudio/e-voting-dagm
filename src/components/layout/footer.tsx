export function Footer() {
  return (
    <footer className="border-t border-border/80 mt-20">
      <div className="container mx-auto py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Panitia Pemilihan OSIS. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
