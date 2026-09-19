/** Instant shell while a screen's data loads. */
export default function Loading() {
    return (
        <div className="animate-pulse" aria-busy="true" aria-label="Loading">
            <div className="pt-3 pb-5">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="mt-3 h-10 w-56 rounded bg-muted" />
                <div className="mt-3 h-3 w-64 rounded bg-muted" />
            </div>
            <div className="card h-48 mb-6" />
            <div className="card h-40 mb-6" />
            <div className="card h-52 mb-6" />
        </div>
    );
}
