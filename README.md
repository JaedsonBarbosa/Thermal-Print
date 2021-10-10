METAS:
    Usando o BDF Viewer, escolher quais as melhores fontes:
      Devem ter um estilo basico e um negrito
      Devem possuir todos os caracteres necessários, inclusive com acentos
    Usando alguma das fontes para testes, implementar trechos em negrito com base no manual
    Precompilar fontes e colocar apenas as informações (glyphs, properties, size, name) nos itens, que devem ser guardados em uma lista em um .ts
    Criar selecao de fonte e impressao geral para testar todas as fontes, deve usar optgroup para organizar por size
    Mover tudo e integrar no projeto principal, mas não devemos apagar este projeto, ele pode virar um projeto autonomo futuramente

METAS pos finalizacao:
    Adicionar demais validacoes e conexões em NFC-e printer
    Adicionar dhRecbto ao bd como item de NFCe emitida
    Adicionar xMsg ao armazenamento do banco de dados como opcional

Avisos:
  No Android testar geração de imagem do canvas e impressão no RawBT, se funcionar esse sera o metodo oficial enquanto não há o WebSerial para Android
  No iOS aparentemente não haverá solução nativa.

Fonte das fontes: https://github.com/Tecate/bitmap-fonts.git, após seleção das melhores fontes, pesquisar sobre copyright e se preciso noticiar algo em alguma parte do sistema.