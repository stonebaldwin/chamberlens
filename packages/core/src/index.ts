/**
 * @repo/core — the reusable, product-agnostic ingestion engine.
 *
 * Heavy/runtime-specific bits (PDF extraction via unpdf, the full pipeline) are
 * reachable from this barrel for Node/Workers consumers. Front-end code that
 * only needs search should import from "@repo/core/search" to keep its bundle
 * free of the extraction toolchain.
 */
export const CORE_VERSION = "0.1.0";

export * from "./types";
export * from "./util/http";
export * from "./util/hash";
export * from "./util/text";
export * from "./normalize";
export * from "./resolve";
export * from "./adapters";
export * from "./extract";
export * from "./transcribe";
export * from "./search";
export * from "./events";
export * from "./health";
export * from "./ingest";
export * from "./alerts/processor";
