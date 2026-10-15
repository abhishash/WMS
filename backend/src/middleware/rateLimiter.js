
export const rateLimiter = ({ limit = 100, windowMs = 60000 }) => {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
        throw new Error("Rate LImit must be a positive NUmber");
    }

    if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
        throw new Error("Windows must be a positive NUmber");
    }

    // key => {count, resetAt}
    let current = new Map();

    // Periodically remove expired entries.
    const cleanupTimer = setInterval(() => {
        const now = Date.now();

        for (const [key, entry] of clients) {
            if (now >= entry.resetAt) {
                clients.delete(key);
            }
        }
    }, Math.min(windowMs, 60000));

    // Do not keep the Node.js process alive just for cleanup.
    cleanupTimer.unref();

    return (req, res, next) => {

        const now = Date.now();
        // Prefer identity established by trusted authentication middleware.
        const userId = req.user?.id;
        const clientKey = userId != null
            ? `user:${userId}`
            : `ip:${req.ip || req.socket.remoteAddress || "unknown"}`;

        let entry = clients.get(clientKey);

        if (!entry || now >= entry.resetAt) {
            entry = {
                count: 0,
                resetAt: now + windowMs
            };

            clients.set(clientKey, entry);
        }

        entry.count += 1;
        const remaining = Math.max(0, limit - entry.count);
        const retryAfterSeconds = Math.max(
            1,
            Math.ceil((entry.resetAt - now) / 1000)
        );

        res.setHeader("X-RateLimit-Limit", String(limit));
        res.setHeader("X-RateLimit-Remaining", String(remaining));

        if (entry.count > limit) {
            res.setHeader("Retry-After", String(retryAfterSeconds));

            return res.status(429).json({
                error: "Too many requests",
                message: "Rate limit exceeded. Please try again later."
            });
        }

        next();
    };
}