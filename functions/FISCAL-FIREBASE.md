# Modulo Fiscal sem Hostinger

O modulo fiscal do MilkyPot agora usa:

- `Firebase Hosting` para o painel
- `Cloud Functions` para backend fiscal
- `Firestore` para configuracao e historico
- `Cloud Storage` para certificados A1

## Functions adicionadas

- `getFiscalHealth`
- `getFiscalConfig`
- `saveFiscalConfig`
- `uploadFiscalCertificate`
- `listFiscalNotes`
- `emitFiscalDocument`
- `cancelFiscalNote`

## Estrutura no Firestore

- `franchises/{franchiseId}/fiscal/config`
- `franchises/{franchiseId}/fiscal_notes/{noteId}`

## Estrutura no Storage

- `fiscal-certificates/{franchiseId}/current-*.pfx`

## Limite atual

O backend Firebase ja centraliza o modulo fiscal sem Hostinger, mas a `NFC-e real` ainda depende de um provedor fiscal ou motor emissor integrado ao backend.

Hoje o fluxo esta assim:

- `Cupom nao fiscal`: funcional no Firebase
- `Configuracao fiscal`: funcional no Firebase
- `Upload de certificado`: funcional no Firebase
- `Historico e cancelamento interno`: funcional no Firebase
- `NFC-e SEFAZ`: pronta para integrar com provedor externo

## Proximo passo para emissao real

Configurar um provedor fiscal em Cloud Functions ou Cloud Run, por exemplo:

- Nuvem Fiscal
- Focus NFe
- Notaas

Assim o projeto continua sem Hostinger e com backend profissional no ecossistema Google.
