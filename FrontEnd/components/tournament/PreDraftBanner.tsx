export default function PreDraftBanner({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center w-full relative border-t border-b border-white px-3 py-4 min-h-[120px] md:min-h-[160px] lg:min-h-[192px] md:px-2 md:py-1 ${className ?? ''}`}
      data-name="Blank Slate"
    >
      <div className="flex flex-col items-center justify-center relative shrink-0 max-w-full" data-name="Draft Text">
        <p className="font-sans font-normal text-white m-0 text-center text-base sm:text-lg md:text-2xl lg:text-[32px] leading-normal">
          The draft for this event has not yet started
        </p>
      </div>
    </div>
  );
}
