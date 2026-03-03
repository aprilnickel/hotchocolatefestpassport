export const metadata = {
  title: "About | Hot Chocolate Festival Passport",
  description: "About the app, the Vancouver Hot Chocolate Festival, and the app creator.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="mb-2 text-2xl font-bold hidden md:block">About</h1>
      <p className="mb-8 text-burgundy/90">
        Learn more about the festival, and the story of how the companion app came to be.
      </p>

      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold text-burgundy">About the festival</h2>
        <p className="text-burgundy/90">
          The Vancouver Hot Chocolate Festival is an annual event where cafés and chocolatiers
          across the city create special hot chocolate offerings. Each year, participants can
          explore unique flavours, support local businesses, and vote for their favourites. The
          festival typically runs from mid-January to mid-February.
        </p>
        <a
          href="https://hotchocolatefest.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline hover:no-underline inline-link"
        >
          Visit official festival website
          <span className="inline-flex shrink-0" aria-hidden>
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
        </a>
      </section>

      <div className="mb-8 rounded-lg border border-burgundy/50 bg-cream/50 px-4 py-5">
        <section className="mb-8">
          <h2 className="mb-2 text-lg font-semibold text-burgundy">About this app</h2>
          <p className="text-burgundy/90">
            Hot Chocolate Festival Passport is a companion web app for the Vancouver Hot Chocolate
            Festival. Use it to browse this year&apos;s drinks, save favourites to your wishlist, and
            keep a journal of the drinks you&apos;ve tried—so you never forget a great sip.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-burgundy">About the creator</h2>
          <p className="text-burgundy/90 mb-2">
            Hey, I'm April!
          </p>
          <p className="text-burgundy/90 mb-2">
            As an avid Hot Chocolate Festival participant, each year I would spend an embarassingly long time browsing the festival website and dreaming of which drinks to try first.
          </p>
          <p className="text-burgundy/90 mb-2">
            And each year, I would spend more time making spreadsheets and copying notes over from the festival website than I did actually drinking hot chocolate!
          </p>
          <p className="text-burgundy/90 mb-2">
            So finally, in 2026, I decided to build the app of my dreams to help me get the most out of the festival.
          </p>
          <p className="text-burgundy/90 mb-2">
            And I'm inviting you, fellow festival participant, to join me here! My hope for all of us is that we can spend more time checking out the incredible vendors, and less time planning where we'll go next.
          </p>
          <p className="text-burgundy/90 mb-2">
            I hope you love it as much as I do! If you have any feedback, please feel free to reach out to me{" "}
            <button className="inline-link underline hover:no-underline posthog-feedback-btn-feedback">
              here
            </button>.
          </p>
          <p className="mb-2">
            <a
              href="https://aprildawne.com/support"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline hover:no-underline inline-link"
            >
              Enjoy the app? Support April by buying her a hot chocolate!
              <span className="inline-flex align-middle shrink-0" aria-hidden>
                <svg className="size-4 inline-block" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </a>
          </p>
          <p>
            <a
              href="https://aprildawne.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline hover:no-underline inline-link"
            >
              Learn more about April here
              <span className="inline-flex shrink-0" aria-hidden>
                <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </span>
            </a>
          </p>
        </section>
      </div>
    </main>
  );
}
