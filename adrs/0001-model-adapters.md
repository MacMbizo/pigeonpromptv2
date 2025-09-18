# ADR 0001 — Model Adapter Abstraction

Status: Accepted
Date: 2025-08-23

Decision
Adopt a provider-agnostic ModelAdapter interface to normalize prompt formatting, auth, streaming, error handling, and token limits across providers.

Scope (initial providers)
- OpenAI, Anthropic, Google Gemini, Mistral, Ollama, DeepSeek

Rationale
- Enables quick provider swaps and A/B testing
- Reduces coupling to proprietary prompt formats
- Simplifies fallbacks and rate-limit backoff strategies

Consequences
- Slight upfront complexity in adapter design and testing
- Requires conformance tests per provider