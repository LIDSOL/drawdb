// for jaeger tracing instance exec the docker command in ./docker_command.text

import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { Resource } from "@opentelemetry/resources";
// import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { B3Propagator } from "@opentelemetry/propagator-b3";

// const exporter = new OTLPTraceExporter({
//     url: 'http://localhost:4317/v1/traces',
// });

const exporter = new OTLPTraceExporter({
  url: "http://localhost:4318/v1/traces",
});

const provider = new WebTracerProvider({
  resource: new Resource({
    "service.name": "drawbd",
  }),
  spanProcessors: [
    new SimpleSpanProcessor(new ConsoleSpanExporter()),
    new SimpleSpanProcessor(exporter),
  ],
});

provider.register({
  contextManager: new ZoneContextManager(),
  propagator: new B3Propagator(),
});

registerInstrumentations({
  instrumentations: [
    getWebAutoInstrumentations({
      "@opentelemetry/instrumentation-document-load": {
        clearTimingResources: true,
      },
    }),
  ],
});

console.log("Tracing initialized");
