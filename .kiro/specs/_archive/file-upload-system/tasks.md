# Sistema de Upload de Ficheiros — Tarefas

## Tarefas de Implementação

- [x] 1. Criar tipo FileReference e constantes de validação em @clever/shared
  - Design ref: [Modelo de Dados](design.md#1-modelo-de-dados) + [Validação](design.md#5-validação)
  - Covers: REQ-01, REQ-05, REQ-06
  - Test ref: [MI-IT-26](tests.md#mi--plano-executável), [MI-IT-27](tests.md#mi--plano-executável), [MI-IT-28](tests.md#mi--plano-executável), [MI-IT-29](tests.md#mi--plano-executável)
  - Done when: `FileReference` interface, `ACCEPTED_MIME_TYPES`, `ACCEPTED_EXTENSIONS`, `MAX_FILE_SIZE`, `validateFile()` e `isImageMimeType()` exportados de `@clever/shared`; testes MI-IT-26 a MI-IT-29 passam

- [x] 2. Alterar Phase5Data para usar FileReference em vez de string
  - Design ref: [Modelo de Dados — Campos de ficheiros no data](design.md#1-modelo-de-dados)
  - Covers: REQ-05, REQ-06
  - Test ref: —
  - Done when: `Phase5Data.fotoURL` é `FileReference | null` em vez de `string`; tipo `InstallationsProgramming` compila sem erros; defaults actualizados na route de instalações

- [x] 3. Criar endpoints de ficheiros no backend (upload, download, eliminação)
  - Design ref: [API — Endpoints de Ficheiros](design.md#3-api--endpoints-de-ficheiros) + [Armazenamento R2](design.md#2-armazenamento-r2)
  - Covers: REQ-01, REQ-03, REQ-04, REQ-05
  - Test ref: [MI-IT-01](tests.md#mi--plano-executável) a [MI-IT-11](tests.md#mi--plano-executável)
  - Done when: POST `/api/content/{type}/{uuid}/files` aceita multipart e armazena em R2 com prefixo `files/`; GET `/api/content/{type}/{uuid}/files/{fileKey}` serve ficheiro com Content-Type correcto; DELETE `/api/content/{type}/{uuid}/files/{fileKey}` remove ficheiro do R2 e referência do data; testes MI-IT-01 a MI-IT-11 passam

- [x] 4. Adicionar limpeza best-effort de ficheiros na eliminação de conteúdo
  - Design ref: [Fluxo de Submissão — Eliminação de conteúdo](design.md#4-fluxo-de-submissão)
  - Covers: REQ-04
  - Test ref: [MI-IT-12](tests.md#mi--plano-executável)
  - Done when: Ao eliminar conteúdo (soft delete), ficheiros em `files/{type}/{uuid}/` são listados e eliminados do R2 em best-effort; falha na eliminação de ficheiros não bloqueia a eliminação do conteúdo; teste MI-IT-12 passa

- [x] 5. Criar componente FileUploadZone
  - Design ref: [Componente FileUploadZone](design.md#6-componente-fileuploadzone)
  - Covers: REQ-01, REQ-02, REQ-04, REQ-06
  - Test ref: [MI-IT-17](tests.md#mi--plano-executável) a [MI-IT-22](tests.md#mi--plano-executável)
  - Done when: Componente em `packages/frontend/src/components/common/FileUploadZone.vue` aceita props (fieldName, label, multiple, existingFiles, acceptImages, acceptDocuments, disabled); valida tipo e tamanho no cliente; gera pré-visualização de imagens via `URL.createObjectURL()`; emite evento `files-changed`; marca ficheiros existentes para remoção; modo singular substitui ficheiro; alvo de toque mínimo 44px; testes MI-IT-17 a MI-IT-22 passam

- [x] 6. Criar componente FileDisplay
  - Design ref: [Componente FileDisplay](design.md#7-componente-filedisplay)
  - Covers: REQ-03, REQ-06
  - Test ref: [MI-IT-23](tests.md#mi--plano-executável) a [MI-IT-25](tests.md#mi--plano-executável)
  - Done when: Componente em `packages/frontend/src/components/common/FileDisplay.vue` apresenta imagens como miniaturas clicáveis e documentos como links de download; estado visual para ficheiro indisponível; lista vazia não renderiza; layout responsivo (grid 2 colunas mobile); testes MI-IT-23 a MI-IT-25 passam

- [x] 7. Criar composable useFileUpload
  - Design ref: [Composable useFileUpload](design.md#8-composable-usefileupload)
  - Covers: REQ-01, REQ-03, REQ-04
  - Test ref: [MI-IT-13](tests.md#mi--plano-executável) a [MI-IT-16](tests.md#mi--plano-executável)
  - Done when: Composable em `packages/frontend/src/composables/useFileUpload.ts` expõe uploading, deleting, error, uploadFiles(), deleteFile(), getFileUrl(), clearError(); usa `await fetch().then().catch()` para chamadas HTTP; testes MI-IT-13 a MI-IT-16 passam

- [x] 8. Integrar upload nas vistas de Programação de Instalações
  - Design ref: [Integração nas Vistas](design.md#9-integração-nas-vistas)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04, REQ-05
  - Test ref: [MA-01](tests.md#ma--plano-executável-de-aceitação), [MA-08](tests.md#ma--plano-executável-de-aceitação) a [MA-17](tests.md#ma--plano-executável-de-aceitação)
  - Done when: `InstallationsProgrammingCreateView` inclui FileUploadZone para campo fotoURL (multiple: false, acceptDocuments: false); `InstallationsProgrammingUpdateView` inclui FileUploadZone com existingFiles carregado; `InstallationsProgrammingDetailView` inclui FileDisplay para a foto; lógica de submissão processa upload após criação e eliminação+upload na edição; testes MA-01, MA-08 a MA-17 passam

## Tarefas de Teste

- [x] 9. Testes de integração [MI] — Shared (constantes e validação)
  - Design ref: [Validação](design.md#5-validação)
  - Covers: REQ-01
  - Test ref: [MI-IT-26](tests.md#mi--plano-executável) a [MI-IT-29](tests.md#mi--plano-executável)
  - Done when: Ficheiro de teste em `packages/shared/src/__tests__/file-validation.test.ts`; testes MI-IT-26 a MI-IT-29 passam

- [x] 10. Testes de integração [MI] — Backend (endpoints + R2)
  - Design ref: [API — Endpoints de Ficheiros](design.md#3-api--endpoints-de-ficheiros) + [Tratamento de Erros](design.md#10-tratamento-de-erros)
  - Covers: REQ-01, REQ-03, REQ-04, REQ-05
  - Test ref: [MI-IT-01](tests.md#mi--plano-executável) a [MI-IT-12](tests.md#mi--plano-executável)
  - Done when: Ficheiro de teste em `packages/backend/src/__tests__/file-upload.test.ts`; testes MI-IT-01 a MI-IT-12 passam com miniflare R2; cobertura de upload, download, eliminação, limpeza de conteúdo e cenários de erro da secção 10

- [x] 11. Testes de integração [MI] — Frontend (composable + componentes)
  - Design ref: [Composable useFileUpload](design.md#8-composable-usefileupload) + [FileUploadZone](design.md#6-componente-fileuploadzone) + [FileDisplay](design.md#7-componente-filedisplay) + [Tratamento de Erros](design.md#10-tratamento-de-erros)
  - Covers: REQ-01, REQ-02, REQ-03, REQ-04
  - Test ref: [MI-IT-13](tests.md#mi--plano-executável) a [MI-IT-25](tests.md#mi--plano-executável)
  - Done when: Ficheiros de teste em `packages/frontend/src/__tests__/`; testes MI-IT-13 a MI-IT-25 passam; cobertura de useFileUpload, FileUploadZone, FileDisplay e cenários de erro da secção 10

- [ ]* 12. Testes de aceitação [MA]
  - Design ref: [Integração nas Vistas](design.md#9-integração-nas-vistas)
  - Covers: REQ-01 a REQ-06
  - Test ref: [MA-01](tests.md#ma--plano-executável-de-aceitação) a [MA-19](tests.md#ma--plano-executável-de-aceitação)
  - Done when: Testes MA-01 a MA-19 verificados manualmente ou via testes E2E; todos os critérios de aceitação validados
