# Sistema de Upload de Ficheiros — Plano de Testes

## [MI] — Estratégia de Testes de Integração

| Interface | Âmbito do teste | Dependências mockadas | REQ-ID |
|-----------|----------------|----------------------|--------|
| Endpoint POST `/api/content/{type}/{uuid}/files` | Upload de ficheiros: validação tipo/tamanho, escrita R2, actualização do data do conteúdo | R2 bucket (miniflare) | REQ-01, REQ-05 |
| Endpoint GET `/api/content/{type}/{uuid}/files/{fileKey}` | Download de ficheiro: leitura R2, Content-Type correcto, 404 para ficheiro inexistente | R2 bucket (miniflare) | REQ-03 |
| Endpoint DELETE `/api/content/{type}/{uuid}/files/{fileKey}` | Eliminação de ficheiro: remoção R2, actualização do data do conteúdo | R2 bucket (miniflare) | REQ-04 |
| Composable useFileUpload | uploadFiles, deleteFile, getFileUrl: chamadas HTTP correctas, estados reactivos, tratamento de erros | fetch (mock) | REQ-01, REQ-04 |
| Componente FileUploadZone | Selecção de ficheiros, validação cliente (tipo/tamanho), pré-visualização de imagens, emissão de eventos, marcação para remoção | — | REQ-01, REQ-02, REQ-04 |
| Componente FileDisplay | Apresentação de imagens como miniaturas, documentos como links, estado de ficheiro indisponível | — | REQ-03 |
| Constantes de validação (@clever/shared) | Lista de tipos MIME aceites, tamanho máximo, função de validação | — | REQ-01 |
| Eliminação de conteúdo com ficheiros | Soft delete do conteúdo + eliminação best-effort dos ficheiros por prefixo R2 | R2 bucket (miniflare) | REQ-04 |

## [MI] — Plano Executável

| Test ID | Interface | Comportamento | Dados de entrada | Resultado esperado | REQ-ID |
|---------|-----------|---------------|-----------------|-------------------|--------|
| MI-IT-01 | POST `/api/content/{type}/{uuid}/files` | Upload de ficheiro válido (imagem) | multipart com ficheiro JPG 2 MB, fieldName="fotos_instalacao" | 200 — FileReference[] com key, name, mimeType, size correctos | REQ-01, REQ-05 |
| MI-IT-02 | POST `/api/content/{type}/{uuid}/files` | Upload de múltiplos ficheiros válidos | multipart com 3 ficheiros (JPG, PNG, PDF) | 200 — Array de 3 FileReference | REQ-01, REQ-05 |
| MI-IT-03 | POST `/api/content/{type}/{uuid}/files` | Rejeição de tipo MIME não aceite | multipart com ficheiro .exe | 400 — "Tipo de ficheiro não suportado: application/x-msdownload" | REQ-01 |
| MI-IT-04 | POST `/api/content/{type}/{uuid}/files` | Rejeição de ficheiro > 10 MB | multipart com ficheiro 15 MB | 400 — "O ficheiro excede o tamanho máximo de 10 MB" | REQ-01 |
| MI-IT-05 | POST `/api/content/{type}/{uuid}/files` | Conteúdo não encontrado | uuid inexistente | 404 — "Conteúdo não encontrado" | REQ-05 |
| MI-IT-06 | POST `/api/content/{type}/{uuid}/files` | Ficheiro armazenado com prefixo correcto | multipart com ficheiro válido | R2 key = `files/{type}/{uuid}/{fileId}.{ext}` | REQ-05 |
| MI-IT-07 | POST `/api/content/{type}/{uuid}/files` | Data do conteúdo actualizado com FileReference | multipart com ficheiro válido, fieldName="ficheiros" | Conteúdo em R2 contém FileReference no campo indicado | REQ-05 |
| MI-IT-08 | GET `/api/content/{type}/{uuid}/files/{fileKey}` | Download de ficheiro existente | fileKey de ficheiro previamente carregado | 200 — body binário com Content-Type correcto | REQ-03 |
| MI-IT-09 | GET `/api/content/{type}/{uuid}/files/{fileKey}` | Ficheiro não encontrado | fileKey inexistente | 404 — "Ficheiro não encontrado" | REQ-03 |
| MI-IT-10 | DELETE `/api/content/{type}/{uuid}/files/{fileKey}` | Eliminação de ficheiro existente | fileKey de ficheiro previamente carregado | 200 — ficheiro removido do R2, referência removida do data | REQ-04 |
| MI-IT-11 | DELETE `/api/content/{type}/{uuid}/files/{fileKey}` | Eliminação de ficheiro inexistente | fileKey inexistente | 404 — "Ficheiro não encontrado" | REQ-04 |
| MI-IT-12 | Eliminação de conteúdo | Soft delete com limpeza best-effort de ficheiros | DELETE `/api/content/{type}/{uuid}` com ficheiros associados | Conteúdo soft-deleted, ficheiros R2 eliminados | REQ-04 |
| MI-IT-13 | useFileUpload — uploadFiles | Chamada HTTP correcta e retorno de FileReference[] | contentType, uuid, fieldName, File[] | POST multipart enviado, FileReference[] retornado, uploading=true durante operação | REQ-01 |
| MI-IT-14 | useFileUpload — deleteFile | Chamada HTTP correcta e retorno boolean | contentType, uuid, fileKey | DELETE enviado, true retornado, deleting=true durante operação | REQ-04 |
| MI-IT-15 | useFileUpload — getFileUrl | Construção de URL correcta | contentType, uuid, fileKey | URL = `/api/content/{type}/{uuid}/files/{fileKey}` | REQ-03 |
| MI-IT-16 | useFileUpload — erro de rede | Tratamento de erro de rede no upload | fetch rejeita com TypeError | error.value = "Falha no upload. Tente novamente.", uploading=false | REQ-01 |
| MI-IT-17 | FileUploadZone | Selecção de ficheiro válido emite evento | File JPG 2 MB | Evento files-changed emitido com newFiles=[file] | REQ-01 |
| MI-IT-18 | FileUploadZone | Rejeição de ficheiro com tipo inválido | File .exe | Ficheiro não adicionado, mensagem de erro inline | REQ-01 |
| MI-IT-19 | FileUploadZone | Rejeição de ficheiro > 10 MB | File 15 MB | Ficheiro não adicionado, mensagem de erro inline | REQ-01 |
| MI-IT-20 | FileUploadZone | Pré-visualização de imagem | File PNG | URL.createObjectURL chamado, miniatura apresentada | REQ-02 |
| MI-IT-21 | FileUploadZone | Marcação de ficheiro existente para remoção | existingFiles com 1 ficheiro, clique em remover | Evento files-changed com removedKeys=[key] | REQ-04 |
| MI-IT-22 | FileUploadZone | Modo singular substitui ficheiro existente | multiple=false, existingFiles com 1 ficheiro, novo ficheiro selecionado | removedKeys=[old key], newFiles=[new file] | REQ-01 |
| MI-IT-23 | FileDisplay | Imagem apresentada como miniatura clicável | files com 1 FileReference de imagem | Elemento img com src do endpoint de download | REQ-03 |
| MI-IT-24 | FileDisplay | Documento apresentado como link de download | files com 1 FileReference de PDF | Elemento a com href do endpoint de download | REQ-03 |
| MI-IT-25 | FileDisplay | Lista vazia não renderiza nada | files=[] | Componente não renderiza DOM | REQ-03 |
| MI-IT-26 | Constantes de validação | Lista de tipos MIME aceites correcta | — | ACCEPTED_MIME_TYPES contém 9 tipos (image/jpeg, image/png, image/gif, image/webp, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet) | REQ-01 |
| MI-IT-27 | Constantes de validação | Tamanho máximo = 10 MB | — | MAX_FILE_SIZE = 10_485_760 | REQ-01 |
| MI-IT-28 | Constantes de validação | Função validateFile rejeita tipo inválido | File com type="application/zip" | { valid: false, error: "tipo não suportado" } | REQ-01 |
| MI-IT-29 | Constantes de validação | Função validateFile rejeita tamanho excessivo | File com size=15_000_000 | { valid: false, error: "tamanho excedido" } | REQ-01 |

## [MA] — Plano Executável de Aceitação

| Test ID | CA-ID | Given / When / Then | Dados | Critério de Passagem |
|---------|-------|---------------------|-------|----------------------|
| MA-01 | CA-01.1 | Given: formulário de criação de Instalação aberto / When: formulário carrega / Then: zona de upload visível | Instalação nova | Zona de upload presente e interativa |
| MA-02 | CA-01.2 | Given: zona de upload visível / When: utilizador seleciona 3 ficheiros / Then: 3 ficheiros na lista | 3 ficheiros (1 JPG, 1 PDF, 1 PNG) | Todos os 3 ficheiros aparecem na lista |
| MA-03 | CA-01.3 | Given: zona de upload visível / When: utilizador seleciona ficheiro JPG / Then: ficheiro aceite | Ficheiro test.jpg (2 MB) | Ficheiro adicionado sem erro |
| MA-04 | CA-01.3 | Given: zona de upload visível / When: utilizador seleciona ficheiro EXE / Then: ficheiro rejeitado | Ficheiro test.exe (1 MB) | Mensagem de erro de tipo apresentada |
| MA-05 | CA-01.4 | Given: zona de upload visível / When: utilizador seleciona ficheiro de 15 MB / Then: ficheiro rejeitado | Ficheiro large.jpg (15 MB) | Mensagem de erro de tamanho apresentada |
| MA-06 | CA-01.4 | Given: zona de upload visível / When: utilizador seleciona ficheiro de 9 MB / Then: ficheiro aceite | Ficheiro ok.pdf (9 MB) | Ficheiro adicionado sem erro |
| MA-07 | CA-01.5 | Given: registo com 10 ficheiros / When: utilizador adiciona mais 5 / Then: 15 ficheiros no total | 15 ficheiros variados | Todos aceites sem limite |
| MA-08 | CA-02.1 | Given: utilizador seleciona 2 imagens / When: imagens adicionadas / Then: miniaturas visíveis | 2 ficheiros PNG | 2 miniaturas apresentadas no formulário |
| MA-09 | CA-02.2 | Given: utilizador seleciona imagem / When: imagem adicionada / Then: pré-visualização imediata | 1 ficheiro JPG | Miniatura aparece antes de submeter |
| MA-10 | CA-03.1 | Given: registo com 1 imagem e 1 PDF / When: vista de detalhe aberta / Then: miniatura + link download | Registo existente | Imagem como miniatura clicável, PDF como link |
| MA-11 | CA-03.2 | Given: registo com ficheiros / When: vista de edição aberta / Then: ficheiros com botão remover | Registo existente | Cada ficheiro tem opção de remoção |
| MA-12 | CA-04.1 | Given: vista de edição com ficheiros / When: utilizador clica remover / Then: ficheiro marcado | Registo com 2 ficheiros | Ficheiro visualmente marcado para eliminação |
| MA-13 | CA-04.2 | Given: ficheiro marcado para eliminação / When: formulário submetido / Then: ficheiro eliminado do armazenamento | Registo com ficheiro marcado | Ficheiro não existe no armazenamento após submissão |
| MA-14 | CA-04.3 | Given: ficheiro eliminado do armazenamento / When: submissão concluída / Then: referência removida | Registo atualizado | ID do ficheiro não consta na lista do registo |
| MA-15 | CA-05.1 | Given: formulário com ficheiros novos / When: submissão / Then: cada ficheiro tem ID único | 2 ficheiros novos | 2 IDs únicos gerados |
| MA-16 | CA-05.2 | Given: ficheiros carregados / When: registo guardado / Then: lista de IDs no registo | Registo após upload | Campo de ficheiros contém FileReferences correctas |
| MA-17 | CA-05.3 | Given: ficheiros carregados / When: armazenamento verificado / Then: ficheiros com prefixo dedicado | Verificação de armazenamento | Ficheiros em `files/{type}/{uuid}/` separados dos dados |
| MA-18 | CA-06.1 | Given: componente de upload implementado / When: revisão de código / Then: componente reutilizável | Código fonte | Sem acoplamento a tipo de conteúdo específico |
| MA-19 | CA-06.2 | Given: novo tipo de conteúdo precisa de upload / When: ativação configurada / Then: funcional sem desenvolvimento adicional | Configuração mínima | Upload funciona no novo tipo com configuração apenas |
