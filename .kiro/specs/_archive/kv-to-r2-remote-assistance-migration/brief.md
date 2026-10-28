# Brief

I need to import DATA from an old KV into the new R2 Storage (new Schemas).We will start with the Assistencias remotas. You will need to list all Assistencias remotas by prefix a KV on this account 98dfed939a59dca09770880eab939b79 . KV clever-clever-kvand you will need to import them with a script via API. I will want a JSON with all success and a JSON with all Errors.I will provide you an example of a Assistencias remotas on the curretn KV

KV Prefix: assistencias-remotas-YEAR-UUID.json
From Year 2024 to Current Year

example 1
{"cliente":"Restaurante Raposeira","tipoAssistencia":"TELEMÓVEL","tecnicoResponsavel":"João Bernardino","quemAtendeu":"sra. Anabela","dataPedido":"2025-11-06T10:34:00.000Z","dataAssistencia":"2025-11-06T10:34:00.000Z","inicioAssistencia":"2025-11-06T10:30:00.000Z","fimAssistencia":"2025-11-06T10:45:00.000Z","motivoPedido":"Ajudar cliente a exportar saft","relatorioAssistencia":"10h34 - 10h39","valorAssist":6.25,"contratoValor":"€0,00","contrato":false,"garantia":false,"resolvido":true,"relatorio":"","anexos":"","totalComIva":7.6875,"pertenceAnoContrato":"2025","id":"98090b82-d515-47de-846d-165abacd1beb","createdAt":"2025-11-06T16:32:24.654Z","updatedAt":"2025-11-06T16:32:24.654Z"}

Example 2
{"cliente":"Tabacaria POP","tipoAssistencia":"REMOTA","tecnicoResponsavel":"João Bernardino","quemAtendeu":"sra. Joana","dataPedido":"2026-02-02T09:35:00.000Z","dataAssistencia":"2026-02-02T09:35:00.000Z","inicioAssistencia":"2026-02-02T09:30:00.000Z","fimAssistencia":"2026-02-02T13:15:00.000Z","motivoPedido":"Adicionar novos produtos e familias, resolver problema de gestão dos stocks não estar a funcionar e dar formação à cliente","relatorioAssistencia":"Adicionar novos produtos e familias, resolver problema de gestão dos stocks não estar a funcionar e dar formação à cliente. Tentar resolver problema do scanner no contas certas, sem sucesso\n\ntempo - 09h35 - 13h15 (com Pausa 25 minutos)","valorAssist":112.5,"contratoValor":"€0,00","contrato":false,"garantia":false,"resolvido":true,"relatorio":"","anexos":"","totalComIva":138.375,"pertenceAnoContrato":"2026","id":"b17be413-6dbd-4bc4-985c-4a2f9e72a92e","createdAt":"2026-02-02T14:51:39.691Z","updatedAt":"2026-02-02T14:51:39.691Z"}
