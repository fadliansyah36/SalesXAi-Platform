# Remotion Renderer

Independent Node.js rendering service for Phase 10. FastAPI owns authorization and render-job lifecycle; this service owns isolated Remotion rendering, bounded concurrency, cancellation, output validation and private Storage delivery. It is not hosted inside the FastAPI process.
