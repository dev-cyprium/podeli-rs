export function InquirySupport({ reference }: { reference: string }) {
  return (
    <p className="mt-2 text-xs text-muted-foreground">
      Nema odgovora ili vam treba pomoć? Pišite podršci na{" "}
      <a
        className="text-podeli-blue underline"
        href={`mailto:kontakt@podeli.rs?subject=${encodeURIComponent(`Pomoć za upit ${reference}`)}`}
      >
        kontakt@podeli.rs
      </a>
      .
    </p>
  );
}
