document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM completamente carregado e analisado."); // DEBUG
  const logoEmpresaUrlRelativa = "img/logo.png"; // Caminho relativo para o logo
  let logoEmpresaBase64 = null;
  //let idOrcamentoAtual = null;

  // --- Seletores de Elementos ---
  // Função auxiliar para obter elementos e logar erro se não encontrado
  function getElement(id, isQuerySelector = false) {
    const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id);
    if (!element) {
      console.error(`ERRO FATAL: Elemento com seletor "${id}" não encontrado no DOM.`);
    }
    return element;
  }

  //const btnNovoOrcamento = getElement("btnNovoOrcamento");
  //const conteudoPrincipal = getElement("conteudoPrincipal");
  const orcamentoNumeroInput = getElement("orcamentoNumero");
  const clienteNomeInput = getElement("clienteNome");
  const clienteTelefoneInput = getElement("clienteTelefone");
  const clienteEmailInput = getElement("clienteEmail");
  const clienteEnderecoInput = getElement("clienteEndereco");
  const clienteObservacaoInput = getElement("clienteObservacao");
  const formProdutoTitle = getElement("formProdutoTitle");
  const editItemIdInput = getElement("editItemId");
  const produtoNomeInput = getElement("produtoNome");
  const produtoDescricaoInput = getElement("produtoDescricao");
  const produtoQuantidadeInput = getElement("produtoQuantidade");
  const produtoValorInput = getElement("produtoValor");
  const produtoMedidasInput = getElement("produtoMedidas");
  const produtoImagemInput = getElement("produtoImagem");
  const imagemPreview = getElement("imagemPreview");
  const btnSalvarProduto = getElement("btnSalvarProduto");
  const btnCancelarEdicao = getElement("btnCancelarEdicao");
  const tabelaOrcamentoBody = getElement("#tabelaOrcamento tbody", true);
  const nenhumItemRow = getElement("nenhumItemRow");
  const descontoPercentualInput = getElement("descontoPercentual");
  const valorAcrescimoInput = getElement("valorAcrescimo");
  const subtotalItensValorSpan = getElement("subtotalItensValor");
  const descontoValorAbsolutoSpan = getElement("descontoValorAbsoluto");
  const acrescimoValorAbsolutoSpan = getElement("acrescimoValorAbsoluto");
  const valorTotalOrcamentoSpan = getElement("valorTotalOrcamento");
  const formasPagamentoInput = getElement("formasPagamento");
  const condicoesPagamentoInput = getElement("condicoesPagamento");
  const btnGerarPDF = getElement("btnGerarPDF");
  const customAlertModal = getElement("customAlertModal");
  const customAlertTitle = getElement("customAlertTitle");
  const customAlertMessage = getElement("customAlertMessage");
  const customAlertCloseButton = getElement("customAlertCloseButton");
  const customAlertOkButton = getElement("customAlertOkButton");
  const formProdutoContainer = getElement("formProdutoContainer"); // Adicionado para rolagem

  let orcamentoItens = [];
  let proximoIdItem = 1; // Para IDs de itens na tabela do frontend
  let imagemBase64Processada = null; // Para imagem do produto em adição/edição

  // --- Funções Auxiliares ---
  async function fetchImageAsBase64(url) {
    try {
      const absoluteUrl = new URL(url, window.location.href).href;
      const response = await fetch(absoluteUrl);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status} ao buscar ${absoluteUrl}`);
      }
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => {
          console.error("Erro no FileReader:", error);
          reject(error);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Falha ao buscar imagem para Base64:", url, error);
      return null;
    }
  }

  // Carrega o logo da empresa para uso no PDF
  async function carregarLogoEmpresa() {
    console.log("Dentro de carregarLogoEmpresa - Iniciando..."); // DEBUG
    try {
      logoEmpresaBase64 = await fetchImageAsBase64(logoEmpresaUrlRelativa);
      if (!logoEmpresaBase64) {
        console.warn(`Logo da empresa em "${logoEmpresaUrlRelativa}" não pôde ser carregado para o PDF. Verifique o caminho e se está sendo servido corretamente.`);
      } else {
        console.log("Logo da empresa carregado para Base64 com sucesso."); // DEBUG
      }
    } catch (error) {
      console.error("Erro capturado DENTRO de carregarLogoEmpresa:", error);
      // A função fetchImageAsBase64 já loga o erro, mas podemos adicionar um log aqui também.
      // Garante que mesmo se houver um erro aqui, o script prossiga.
    }
    console.log("Dentro de carregarLogoEmpresa - Finalizando."); // DEBUG
  }

  function showAlert(message, title = "Atenção") {
    if (customAlertTitle) customAlertTitle.textContent = title;
    if (customAlertMessage) customAlertMessage.textContent = message;
    if (customAlertModal) {
      customAlertModal.classList.remove("hidden");
      const modalContent = customAlertModal.querySelector(".modal-content");
      if (modalContent) {
        modalContent.classList.remove("opacity-0", "scale-95");
        modalContent.classList.add("opacity-100", "scale-100");
      }
    } else {
      console.error("Elemento do modal de alerta não encontrado.");
      alert(`${title}: ${message}`);
    }
  }

  function closeAlert() {
    if (customAlertModal) {
      const modalContent = customAlertModal.querySelector(".modal-content");
      if (modalContent) {
        modalContent.classList.add("opacity-0", "scale-95");
        setTimeout(() => {
          customAlertModal.classList.add("hidden");
        }, 300);
      }
    }
  }

  if (customAlertCloseButton) {
    customAlertCloseButton.addEventListener("click", closeAlert);
  }
  if (customAlertOkButton) {
    customAlertOkButton.addEventListener("click", closeAlert);
  }

  function formatarInputValorComoMoeda(inputElement) {
    if (!inputElement) return;
    let valor = inputElement.value.replace(/\D/g, "");
    if (valor === "") {
      inputElement.value = "";
      return;
    }
    valor = valor.replace(/^0+(?=\d)/, "");
    let valorNumerico = parseFloat(valor) / 100;
    inputElement.value = valorNumerico.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function desformatarValorMoeda(valorFormatado) {
    if (!valorFormatado) return 0;
    let valorLimpo = String(valorFormatado).replace(/\./g, "");
    valorLimpo = valorLimpo.replace(",", ".");
    return parseFloat(valorLimpo) || 0;
  }

  function mascaraTelefone(event) {
    if (!event || !event.target) return;
    let input = event.target;
    input.value = aplicarMascaraTelefone(input.value);
  }

  function aplicarMascaraTelefone(valor) {
    if (!valor) return "";
    valor = valor.replace(/\D/g, "");
    valor = valor.substring(0, 11);

    if (valor.length > 10) {
      valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (valor.length > 6) {
      valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (valor.length > 2) {
      valor = valor.replace(/^(\d{2})(\d*).*/, "($1) $2");
    } else if (valor.length > 0) {
      valor = valor.replace(/^(\d*)/, "($1");
    }
    return valor;
  }

  if (clienteTelefoneInput) {
    clienteTelefoneInput.addEventListener("input", mascaraTelefone);
  }
  if (produtoValorInput) {
    produtoValorInput.addEventListener("input", (e) => formatarInputValorComoMoeda(e.target));
  }
  if (valorAcrescimoInput) {
    valorAcrescimoInput.addEventListener("input", (e) => formatarInputValorComoMoeda(e.target));
  }

  if (produtoImagemInput) {
    produtoImagemInput.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const MAX_WIDTH = 800;
            const MAX_HEIGHT = 800;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
            } else {
              if (height > MAX_HEIGHT) {
                width *= MAX_HEIGHT / height;
                height = MAX_HEIGHT;
              }
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            imagemBase64Processada = canvas.toDataURL("image/jpeg", 0.7);
            if (imagemPreview) {
              imagemPreview.src = imagemBase64Processada;
              imagemPreview.classList.remove("hidden");
            }
          };
          img.onerror = () => {
            showAlert("Não foi possível carregar a imagem do produto selecionada.", "Erro de Imagem");
            imagemBase64Processada = null;
            if (imagemPreview) {
              imagemPreview.src = "#";
              imagemPreview.classList.add("hidden");
            }
            if (produtoImagemInput) produtoImagemInput.value = "";
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        imagemBase64Processada = null;
        if (imagemPreview) {
          imagemPreview.src = "#";
          imagemPreview.classList.add("hidden");
        }
      }
    });
  }

  function limparCamposProdutoEImagem() {
    if (produtoNomeInput) produtoNomeInput.value = "";
    if (produtoDescricaoInput) produtoDescricaoInput.value = "";
    if (produtoQuantidadeInput) produtoQuantidadeInput.value = "1";
    if (produtoValorInput) produtoValorInput.value = "";
    if (produtoMedidasInput) produtoMedidasInput.value = "";
    if (produtoImagemInput) produtoImagemInput.value = "";
    imagemBase64Processada = null;
    if (imagemPreview) {
      imagemPreview.src = "#";
      imagemPreview.classList.add("hidden");
    }
    if (editItemIdInput) editItemIdInput.value = "";
    if (formProdutoTitle) formProdutoTitle.textContent = "Adicionar Produto";
    if (btnSalvarProduto) btnSalvarProduto.textContent = "Adicionar Produto";
    if (btnCancelarEdicao) btnCancelarEdicao.classList.add("hidden");
  }

  if (btnSalvarProduto) {
    btnSalvarProduto.addEventListener("click", () => {
      if (!produtoNomeInput || !produtoQuantidadeInput || !produtoValorInput || !editItemIdInput) return;

      const nome = produtoNomeInput.value.trim();
      const descricao = produtoDescricaoInput ? produtoDescricaoInput.value.trim() : "";
      const quantidade = parseInt(produtoQuantidadeInput.value);
      const valor = desformatarValorMoeda(produtoValorInput.value);
      const medidas = produtoMedidasInput ? produtoMedidasInput.value.trim() : "";
      const currentEditItemId = editItemIdInput.value ? parseInt(editItemIdInput.value) : null;

      if (!nome) {
        showAlert("O nome do produto é obrigatório.");
        produtoNomeInput.focus();
        return;
      }
      if (isNaN(quantidade) || quantidade <= 0) {
        showAlert("A quantidade deve ser um número maior que zero.");
        produtoQuantidadeInput.focus();
        return;
      }
      if (valor < 0) {
        showAlert("O valor unitário deve ser um número válido (pode ser zero).");
        produtoValorInput.focus();
        return;
      }

      const subtotal = quantidade * valor;
      if (currentEditItemId) {
        const itemIndex = orcamentoItens.findIndex((item) => item.id === currentEditItemId);
        if (itemIndex > -1) {
          orcamentoItens[itemIndex] = {
            ...orcamentoItens[itemIndex],
            nome,
            descricao,
            quantidade,
            valor,
            medidas,
            subtotal,
            imagem: imagemBase64Processada !== null ? imagemBase64Processada : orcamentoItens[itemIndex].imagem,
          };
        }
      } else {
        orcamentoItens.push({
          id: proximoIdItem++,
          nome,
          descricao,
          quantidade,
          valor,
          medidas,
          subtotal,
          imagem: imagemBase64Processada,
        });
      }
      renderizarTabelaECalcularTotal();
      limparCamposProdutoEImagem();
      if (produtoNomeInput) produtoNomeInput.focus();
    });
  }

  if (btnCancelarEdicao) {
    btnCancelarEdicao.addEventListener("click", () => {
      limparCamposProdutoEImagem();
    });
  }

  function editarItem(itemId) {
    const item = orcamentoItens.find((i) => i.id === itemId);
    if (
      !item ||
      !formProdutoTitle ||
      !btnSalvarProduto ||
      !editItemIdInput ||
      !produtoNomeInput ||
      !produtoDescricaoInput ||
      !produtoQuantidadeInput ||
      !produtoValorInput ||
      !produtoMedidasInput ||
      !imagemPreview ||
      !btnCancelarEdicao ||
      !formProdutoContainer
    )
      return;

    formProdutoTitle.textContent = "Editar Produto";
    btnSalvarProduto.textContent = "Salvar Alterações";
    editItemIdInput.value = item.id;
    produtoNomeInput.value = item.nome;
    produtoDescricaoInput.value = item.descricao;
    produtoQuantidadeInput.value = item.quantidade;
    produtoValorInput.value = item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    produtoMedidasInput.value = item.medidas;

    imagemBase64Processada = item.imagem;
    if (item.imagem) {
      imagemPreview.src = item.imagem;
      imagemPreview.classList.remove("hidden");
    } else {
      imagemPreview.src = "#";
      imagemPreview.classList.add("hidden");
    }
    if (produtoImagemInput) produtoImagemInput.value = "";
    btnCancelarEdicao.classList.remove("hidden");
    produtoNomeInput.focus();
    formProdutoContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function removerItem(itemId) {
    orcamentoItens = orcamentoItens.filter((item) => item.id !== itemId);
    renderizarTabelaECalcularTotal();
    if (editItemIdInput && parseInt(editItemIdInput.value) === itemId) {
      limparCamposProdutoEImagem();
    }
  }

  function calcularTotais() {
    let subtotalItens = 0;
    orcamentoItens.forEach((item) => {
      subtotalItens += item.subtotal;
    });
    const descontoPerc = (descontoPercentualInput ? parseFloat(descontoPercentualInput.value) : 0) || 0;
    const acrescimoValor = valorAcrescimoInput ? desformatarValorMoeda(valorAcrescimoInput.value) : 0;

    const valorDescontoCalc = (subtotalItens * descontoPerc) / 100;
    const subtotalAposDesconto = subtotalItens - valorDescontoCalc;
    const totalFinal = subtotalAposDesconto + acrescimoValor;

    if (subtotalItensValorSpan) subtotalItensValorSpan.textContent = subtotalItens.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (descontoValorAbsolutoSpan) descontoValorAbsolutoSpan.textContent = valorDescontoCalc.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (acrescimoValorAbsolutoSpan) acrescimoValorAbsolutoSpan.textContent = acrescimoValor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (valorTotalOrcamentoSpan) valorTotalOrcamentoSpan.textContent = totalFinal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (descontoPercentualInput) descontoPercentualInput.addEventListener("input", calcularTotais);
  if (valorAcrescimoInput) valorAcrescimoInput.addEventListener("input", calcularTotais);

  function renderizarTabelaECalcularTotal() {
    if (!tabelaOrcamentoBody) return;
    tabelaOrcamentoBody.innerHTML = "";
    if (orcamentoItens.length === 0 && nenhumItemRow) {
      nenhumItemRow.classList.remove("hidden");
    } else if (nenhumItemRow) {
      nenhumItemRow.classList.add("hidden");
      orcamentoItens.forEach((item) => {
        const tr = document.createElement("tr");
        tr.className = "hover:bg-gray-50";
        const imagemSrc = item.imagem || "https://placehold.co/40x40/e2e8f0/cbd5e0?text=S/Img";
        tr.innerHTML = `
                    <td class="p-3"><img src="${imagemSrc}" alt="${item.nome}" class="product-image-preview"></td>
                    <td class="p-3 text-sm text-mami-cinza-escuro">${item.nome}</td>
                    <td class="p-3 text-sm text-gray-600 max-w-xs truncate" title="${item.descricao || ""}">${item.descricao || "-"}</td>
                    <td class="p-3 text-center text-sm text-mami-cinza-escuro">${item.quantidade}</td>
                    <td class="p-3 text-right text-sm text-mami-cinza-escuro">R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td class="p-3 text-sm text-gray-600">${item.medidas || "-"}</td>
                    <td class="p-3 text-right text-sm font-medium text-mami-cinza-escuro">R$ ${item.subtotal.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}</td>
                    <td class="p-3 text-center">
                        <button class="btn-editar text-mami-mostarda hover:text-mami-mostarda-darker mr-2" data-id="${item.id}" title="Editar">✏️</button>
                        <button class="btn-remover text-mami-terracota hover:text-mami-terracota-darker" data-id="${item.id}" title="Remover">🗑️</button>
                    </td>
                `;
        tabelaOrcamentoBody.appendChild(tr);
      });
    }
    adicionarEventListenersAcoes();
    calcularTotais();
  }

  function adicionarEventListenersAcoes() {
    document.querySelectorAll(".btn-editar").forEach((b) => {
      b.removeEventListener("click", handleEditarClick);
      b.addEventListener("click", handleEditarClick);
    });
    document.querySelectorAll(".btn-remover").forEach((b) => {
      b.removeEventListener("click", handleRemoverClick);
      b.addEventListener("click", handleRemoverClick);
    });
  }
  function handleEditarClick(event) {
    if (event && event.currentTarget && event.currentTarget.dataset) {
      editarItem(parseInt(event.currentTarget.dataset.id));
    }
  }
  function handleRemoverClick(event) {
    if (event && event.currentTarget && event.currentTarget.dataset) {
      removerItem(parseInt(event.currentTarget.dataset.id));
    }
  }

  /*async function buscarNovoNumeroOrcamento() {
    console.log("Iniciando buscarNovoNumeroOrcamento..."); // DEBUG
    if (!orcamentoNumeroInput) {
      console.error("ERRO FATAL: orcamentoNumeroInput não foi encontrado no DOM para buscarNovoNumeroOrcamento.");
      return;
    }
    try {
      orcamentoNumeroInput.value = "Buscando...";
      const response = await fetch("api/gerar_numero_orcamento.php", {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();

      if (data.numeroOrcamento) {
        orcamentoNumeroInput.value = data.numeroOrcamento;
        console.log("Número do orçamento recebido da API:", data.numeroOrcamento); // DEBUG
      } else {
        throw new Error(data.message || "Resposta inválida da API (número do orçamento).");
      }
    } catch (error) {
      console.error("Falha ao buscar novo número de orçamento:", error);
      showAlert(`Não foi possível obter um novo número de orçamento: ${error.message}. Verifique o console do servidor PHP.`, "Erro de API");
      orcamentoNumeroInput.value = `ERRO-ANO-${new Date().getFullYear()}`;
    }
    console.log("Finalizando buscarNovoNumeroOrcamento."); // DEBUG
  }*/
  // Busca um novo número de orçamento da API PHP
  /*  async function buscarNovoNumeroOrcamento() {
        if (!orcamentoNumeroInput) return;
        try {
            orcamentoNumeroInput.value = "Buscando...";
            const response = await fetch('api/gerar_numero_orcamento.php', { method: 'POST' });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro HTTP ${response.status}: ${errorText || response.statusText}`);
            }
            const data = await response.json();
            if (data.numeroOrcamento && data.idOrcamento) {
                orcamentoNumeroInput.value = data.numeroOrcamento;
                idOrcamentoAtual = data.idOrcamento; // << Guarda o ID do orçamento atual
            } else {
                throw new Error(data.message || "Resposta inválida da API (número do orçamento).");
            }
        } catch (error) {
            console.error('Falha ao buscar novo número de orçamento:', error);
            showAlert(`Não foi possível obter um novo número de orçamento: ${error.message}.`, 'Erro de API');
            orcamentoNumeroInput.value = `ERRO-${new Date().getFullYear()}`; 
        }
    }*/

  // NOVA FUNÇÃO: Salva o orçamento completo no banco de dados via API PHP
  /* async function salvarOrcamentoCompleto() {
        if (!idOrcamentoAtual) {
            showAlert("Erro: ID do orçamento atual não está definido. Não é possível salvar.", "Erro Crítico");
            return false; // Indica falha
        }

        // 1. Coletar todos os dados em um objeto
        const dadosCompletos = {
            idOrcamento: idOrcamentoAtual,
            numeroOrcamento: orcamentoNumeroInput ? orcamentoNumeroInput.value : '',
            cliente: {
                nome: clienteNomeInput ? clienteNomeInput.value : '',
                telefone: clienteTelefoneInput ? clienteTelefoneInput.value : '',
                email: clienteEmailInput ? clienteEmailInput.value : '',
                endereco: clienteEnderecoInput ? clienteEnderecoInput.value : '',
                observacao: clienteObservacaoInput ? clienteObservacaoInput.value : '',
            },
            itens: orcamentoItens,
            totais: {
                subtotalItens: desformatarValorMoeda(subtotalItensValorSpan.textContent),
                descontoPercentual: parseFloat(descontoPercentualInput.value) || 0,
                descontoCalculado: desformatarValorMoeda(descontoValorAbsolutoSpan.textContent),
                acrescimos: desformatarValorMoeda(valorAcrescimoInput.value),
                totalFinal: desformatarValorMoeda(valorTotalOrcamentoSpan.textContent)
            },
            pagamento: {
                formas: formasPagamentoInput ? formasPagamentoInput.value : '',
                condicoes: condicoesPagamentoInput ? condicoesPagamentoInput.value : ''
            }
        };

        // 2. Enviar para a API PHP
        try {
            showAlert("Salvando orçamento no banco de dados...", "Aguarde");
            const response = await fetch('api/salvar_orcamento.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosCompletos)
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.message || `Erro HTTP ${response.status}`);
            }

            console.log("Resposta do salvamento:", responseData);
            showAlert(responseData.message, "Sucesso");
            return true; // Indica sucesso
        } catch (error) {
            console.error("Erro ao salvar orçamento completo:", error);
            showAlert(`Falha ao salvar o orçamento: ${error.message}`, "Erro de API");
            return false; // Indica falha
        }
    }
    */
  // --- NOVA FUNÇÃO E AJUSTES NA LÓGICA ---

  // Função para resetar e limpar o formulário para um novo estado
  /*  function resetarFormularioCompleto(buscarNovoNumero = true) {
        limparCamposProdutoEImagem();
        
        if (buscarNovoNumero) {
            buscarNovoNumeroOrcamento();
        } else if (orcamentoNumeroInput) {
            orcamentoNumeroInput.value = "";
            orcamentoNumeroInput.placeholder = "Clique em 'Novo Orçamento' para começar";
            idOrcamentoAtual = null;
        }

        // Limpa todos os outros campos
        if(clienteNomeInput) clienteNomeInput.value = "";
        if(clienteTelefoneInput) clienteTelefoneInput.value = "";
        if(clienteEmailInput) clienteEmailInput.value = "";
        if(clienteEnderecoInput) clienteEnderecoInput.value = "";
        if(clienteObservacaoInput) clienteObservacaoInput.value = "";
        if(formasPagamentoInput) formasPagamentoInput.value = "";
        if(condicoesPagamentoInput) condicoesPagamentoInput.value = "";
        if(descontoPercentualInput) descontoPercentualInput.value = "";
        if(valorAcrescimoInput) valorAcrescimoInput.value = "";
        
        orcamentoItens = [];
        proximoIdItem = 1;
        renderizarTabelaECalcularTotal();
    }*/

  // Função de resetar formulário simplificada (sem backend)
  function resetarFormularioCompleto() {
    limparCamposProdutoEImagem();
    if (orcamentoNumeroInput) orcamentoNumeroInput.value = ""; // Removido preenchimento automático
    // if(orcamentoNumeroInput) orcamentoNumeroInput.value = `ORC-${new Date().getFullYear()}-`;
    if (clienteNomeInput) clienteNomeInput.value = "";
    if (clienteTelefoneInput) clienteTelefoneInput.value = "";
    if (clienteEmailInput) clienteEmailInput.value = "";
    if (clienteEnderecoInput) clienteEnderecoInput.value = "";
    if (clienteObservacaoInput) clienteObservacaoInput.value = "";
    if (formasPagamentoInput) formasPagamentoInput.value = "";
    if (condicoesPagamentoInput) condicoesPagamentoInput.value = "";
    if (descontoPercentualInput) descontoPercentualInput.value = "";
    if (valorAcrescimoInput) valorAcrescimoInput.value = "";
    orcamentoItens = [];
    proximoIdItem = 1;
    renderizarTabelaECalcularTotal();
    showAlert("Orçamento gerado e formulário limpo.", "Sucesso");
    if (orcamentoNumeroInput) orcamentoNumeroInput.focus();
  }

  // Função para iniciar um novo orçamento
  /* async function iniciarNovoOrcamento() {
        // Mostra o conteúdo principal
        if(conteudoPrincipal) {
            conteudoPrincipal.classList.remove('hidden');
        }
        
        // Limpa tudo e busca um novo número
        resetarFormularioCompleto(true);
        showAlert("Novo orçamento iniciado. Preencha os dados.", "Pronto!");
    }*/

  // Adiciona o listener ao novo botão
  /* if(btnNovoOrcamento) {
        btnNovoOrcamento.addEventListener('click', iniciarNovoOrcamento);
    }*/

  /*function resetarFormularioCompleto() {
    console.log("Iniciando resetarFormularioCompleto..."); // DEBUG
    limparCamposProdutoEImagem();
    buscarNovoNumeroOrcamento();
    if (clienteNomeInput) clienteNomeInput.value = "";
    if (clienteTelefoneInput) clienteTelefoneInput.value = "";
    if (clienteEmailInput) clienteEmailInput.value = "";
    if (clienteEnderecoInput) clienteEnderecoInput.value = "";
    if (clienteObservacaoInput) clienteObservacaoInput.value = "";
    if (formasPagamentoInput) formasPagamentoInput.value = "";
    if (condicoesPagamentoInput) condicoesPagamentoInput.value = "";
    if (descontoPercentualInput) descontoPercentualInput.value = "";
    if (valorAcrescimoInput) valorAcrescimoInput.value = "";
    orcamentoItens = [];
    proximoIdItem = 1;
    renderizarTabelaECalcularTotal();
    showAlert("Orçamento gerado e formulário limpo.", "Sucesso");
    if (orcamentoNumeroInput) orcamentoNumeroInput.focus();
    console.log("Finalizando resetarFormularioCompleto."); // DEBUG
  }*/

  if (btnGerarPDF) {
    btnGerarPDF.addEventListener("click", async () => {
      if (orcamentoItens.length === 0) {
        showAlert("Adicione pelo menos um item ao orçamento.");
        return;
      }
      /*
      // 1. Tenta salvar o orçamento completo no banco de dados PRIMEIRO
            const salvamentoBemSucedido = await salvarOrcamentoCompleto();
            
            if (!salvamentoBemSucedido) {
                showAlert("O PDF não foi gerado porque houve um erro ao salvar o orçamento.", "Atenção");
                return;
            }*/
      if (typeof window.jspdf === "undefined" || typeof window.jspdf.jsPDF === "undefined" || typeof window.jspdf.jsPDF.API.autoTable === "undefined") {
        showAlert("Erro ao carregar biblioteca PDF. Verifique o console.", "Erro");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      let startY = 15;

      if (logoEmpresaBase64) {
        try {
          const imgProps = doc.getImageProperties(logoEmpresaBase64);
          const logoWidth = 30;
          const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.addImage(logoEmpresaBase64, imgProps.fileType, logoX, startY, logoWidth, logoHeight);
          startY += logoHeight + 7;
        } catch (e) {
          console.error("Erro ao adicionar logo da empresa (Base64) ao PDF:", e);
          startY += 10;
        }
      } else {
        console.warn("Logo da empresa (Base64) não disponível para o PDF.");
        startY += 10;
      }

      doc.setFontSize(18);
      doc.setTextColor("#455929");
      doc.text("Orçamento Detalhado", pageWidth / 2, startY, { align: "center" });
      startY += 8;

      const numOrc = orcamentoNumeroInput ? orcamentoNumeroInput.value.trim() : "";
      if (numOrc) {
        doc.setFontSize(10);
        doc.setTextColor("#312E32");
        doc.text(`Orçamento Nº: ${numOrc}`, pageWidth / 2, startY, { align: "center" });
      }
      startY += 5;

      doc.setFontSize(10);
      doc.setTextColor("#312E32");
      const clienteFields = [
        { label: "Cliente", value: clienteNomeInput ? clienteNomeInput.value.trim() : "" },
        { label: "Telefone", value: clienteTelefoneInput ? clienteTelefoneInput.value.trim() : "" },
        { label: "Email", value: clienteEmailInput ? clienteEmailInput.value.trim() : "" },
        { label: "Endereço", value: clienteEnderecoInput ? clienteEnderecoInput.value.trim() : "" },
        { label: "Obs.", value: clienteObservacaoInput ? clienteObservacaoInput.value.trim() : "", isTextarea: true },
      ];
      clienteFields.forEach((field) => {
        if (field.value) {
          doc.setFont(undefined, "bold");
          doc.text(`${field.label}:`, margin, startY);
          doc.setFont(undefined, "normal");
          const textLines = doc.splitTextToSize(field.value, pageWidth - margin * 2 - 25);
          doc.text(textLines, margin + 25, startY);
          startY += textLines.length * 4 + 2;
        }
      });
      startY += 6;

      const tableColumn = ["Img", "Nome", "Desc.", "Qtd", "V.Unit.", "Med.", "Subtotal"];
      const tableRows = [];
      const imageLoadPromises = [];

      orcamentoItens.forEach((item, index) => {
        tableRows.push([
          "",
          item.nome,
          item.descricao || "-",
          item.quantidade.toString(),
          `R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          item.medidas || "-",
          `R$ ${item.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        ]);
        if (item.imagem) {
          imageLoadPromises.push(
            new Promise((resolve) => {
              const img = new Image();
              img.onload = () => resolve({ img, rowIndex: index, success: true });
              img.onerror = () => resolve({ rowIndex: index, success: false });
              img.src = item.imagem;
            })
          );
        }
      });

      Promise.all(imageLoadPromises)
        .then((loadedImagesData) => {
          const imagesForTable = loadedImagesData
            .filter((d) => d.success)
            .map((d) => ({
              imageData: d.img,
              format: d.img.src.includes("jpeg") ? "JPEG" : "PNG",
              rowIndex: d.rowIndex,
            }));

          doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: startY,
            theme: "striped",
            headStyles: { fillColor: "#DEA043", textColor: "#FFFFFF", fontSize: 8 },
            styles: { fontSize: 7, cellPadding: 1.5, valign: "middle", textColor: "#312E32", overflow: "linebreak" },
            columnStyles: {
              0: { cellWidth: 12, minCellHeight: 12 },
              1: { cellWidth: 33 },
              2: { cellWidth: 48 },
              3: { cellWidth: 10, halign: "center" },
              4: { cellWidth: 20, halign: "right" },
              5: { cellWidth: 20 },
              6: { cellWidth: 20, halign: "right" },
            },
            didDrawCell: (data) => {
              if (data.column.index === 0 && data.row.section === "body") {
                const imgInfo = imagesForTable.find((img) => img.rowIndex === data.row.index);
                if (imgInfo) {
                  try {
                    doc.addImage(imgInfo.imageData, imgInfo.format, data.cell.x + 1, data.cell.y + 1, 10, 10);
                  } catch (e) {
                    console.error("Erro img PDF:", e);
                    doc.setFillColor(230, 230, 230);
                    doc.rect(data.cell.x + 1, data.cell.y + 1, 10, 10, "F");
                    doc.setTextColor(150, 150, 150);
                    doc.setFontSize(6);
                    doc.text("Erro Img", data.cell.x + 2, data.cell.y + 6);
                  }
                }
              }
            },
          });

          let finalY = doc.lastAutoTable.finalY || startY + 10;
          finalY += 7;

          doc.setFontSize(9);
          doc.setTextColor("#312E32");
          const subtotalItensVal = desformatarValorMoeda(subtotalItensValorSpan ? subtotalItensValorSpan.textContent : "0");
          const descontoPercVal = (descontoPercentualInput ? parseFloat(descontoPercentualInput.value) : 0) || 0;
          const valorDescontoAbs = desformatarValorMoeda(descontoValorAbsolutoSpan ? descontoValorAbsolutoSpan.textContent : "0");
          const acrescimoAbsVal = desformatarValorMoeda(valorAcrescimoInput ? valorAcrescimoInput.value : "0");
          const totalFinalVal = desformatarValorMoeda(valorTotalOrcamentoSpan ? valorTotalOrcamentoSpan.textContent : "0");

          const labelX = margin;
          const valueXOffset = 50;

          doc.text("Subtotal dos Itens:", labelX, finalY, { align: "left" });
          doc.text(`R$ ${subtotalItensVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
          finalY += 5;

          if (descontoPercVal > 0) {
            doc.setTextColor("#C44238");
            doc.text(`Desconto (${descontoPercVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%):`, labelX, finalY, { align: "left" });
            doc.text(`- R$ ${valorDescontoAbs.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
            finalY += 5;
          }
          if (acrescimoAbsVal > 0) {
            doc.setTextColor("#455929");
            doc.text("Acréscimos:", labelX, finalY, { align: "left" });
            doc.text(`+ R$ ${acrescimoAbsVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
            finalY += 5;
          }

          doc.setFontSize(11);
          doc.setFont(undefined, "bold");
          doc.setTextColor("#455929");
          doc.text("Total Final:", labelX, finalY + 2, { align: "left" });
          doc.text(`R$ ${totalFinalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, labelX + valueXOffset, finalY + 2, { align: "left" });
          finalY += 8;

          doc.setFontSize(9);
          doc.setTextColor("#312E32");
          doc.setFont(undefined, "normal");
          const pagamentoFields = [
            { label: "Formas de Pagamento", value: formasPagamentoInput ? formasPagamentoInput.value.trim() : "" },
            { label: "Condições/Validade", value: condicoesPagamentoInput ? condicoesPagamentoInput.value.trim() : "" },
          ];
          pagamentoFields.forEach((field) => {
            if (field.value) {
              doc.setFont(undefined, "bold");
              doc.text(`${field.label}:`, margin, finalY);
              doc.setFont(undefined, "normal");
              const textLines = doc.splitTextToSize(field.value, pageWidth - margin * 2 - 35);
              doc.text(textLines, margin + 35, finalY);
              finalY += textLines.length * 3.5 + 3;
            }
          });

          const pageCount = doc.internal.getNumberOfPages();
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
            doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, margin, pageHeight - 10);
          }

          let nomeArquivo = "orcamento.pdf";
          const nomeClienteVal = clienteNomeInput ? clienteNomeInput.value.trim() : "";
          if (nomeClienteVal) {
            const nomeClienteSanitizado = nomeClienteVal.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
            if (nomeClienteSanitizado) nomeArquivo = `${nomeClienteSanitizado}_orcamento.pdf`;
          }
          doc.save(nomeArquivo);
          resetarFormularioCompleto();
        })
        .catch((error) => {
          console.error("Erro ao carregar imagens dos itens para o PDF:", error);
          showAlert("Ocorreu um erro ao processar as imagens dos itens para o PDF.", "Erro");
        });
    });

    // --- Inicialização da Página ---
    /*async function init() {
        await carregarLogoEmpresa();
       // await buscarNovoNumeroOrcamento(); // Busca o número inicial
        renderizarTabelaECalcularTotal();
        limparCamposProdutoEImagem();
        
                if (conteudoPrincipal) {
            conteudoPrincipal.classList.add('hidden'); // Garante que começa escondido
        }
    }*/

    function init() {
      carregarLogoEmpresa();
      if (orcamentoNumeroInput) {
        orcamentoNumeroInput.value = ""; // Campo começa vazio
        //  orcamentoNumeroInput.value = `ORC-${new Date().getFullYear()}-`;
      }
      renderizarTabelaECalcularTotal();
      limparCamposProdutoEImagem();
    }
    init();
  }
});
