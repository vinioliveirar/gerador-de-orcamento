document.addEventListener("DOMContentLoaded", () => {
  const logoEmpresaUrlRelativa = "img/logo.png";
  let logoEmpresaBase64 = null;

  // --- Seletores de Elementos ---
  function getElement(id, isQuerySelector = false) {
    const element = isQuerySelector ? document.querySelector(id) : document.getElementById(id);
    if (!element) {
      console.error(`ERRO: Elemento com seletor "${id}" não encontrado no DOM.`);
    }
    return element;
  }

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
  const formProdutoContainer = getElement("formProdutoContainer");

  let orcamentoItens = [];
  let proximoIdItem = 1;
  let imagemBase64Processada = null;

  // --- Funções Auxiliares ---
  function carregarLogoEmpresa() {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      logoEmpresaBase64 = canvas.toDataURL("image/png");
    };
    img.onerror = () => {
      console.warn(`Logo da empresa em "${logoEmpresaUrlRelativa}" não pôde ser carregado.`);
    };
    img.src = logoEmpresaUrlRelativa;
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
  if (customAlertCloseButton) customAlertCloseButton.addEventListener("click", closeAlert);
  if (customAlertOkButton) customAlertOkButton.addEventListener("click", closeAlert);

  function formatarInputValorComoMoeda(inputElement) {
    if (!inputElement) return;
    let valor = inputElement.value.replace(/\D/g, "");
    if (valor === "") {
      inputElement.value = "";
      return;
    }
    valor = valor.replace(/^0+(?=\d)/, "");
    let valorNumerico = parseFloat(valor) / 100;
    inputElement.value = valorNumerico.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function desformatarValorMoeda(valorFormatado) {
    if (!valorFormatado) return 0;
    let valorLimpo = String(valorFormatado).replace(/\./g, "");
    valorLimpo = valorLimpo.replace(",", ".");
    return parseFloat(valorLimpo) || 0;
  }
  function mascaraTelefone(event) {
    if (!event || !event.target) return;
    event.target.value = aplicarMascaraTelefone(event.target.value);
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
  if (clienteTelefoneInput) clienteTelefoneInput.addEventListener("input", mascaraTelefone);
  if (produtoValorInput) produtoValorInput.addEventListener("input", (e) => formatarInputValorComoMoeda(e.target));
  if (valorAcrescimoInput) valorAcrescimoInput.addEventListener("input", (e) => formatarInputValorComoMoeda(e.target));

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

  // --- Lógica Principal do Orçamento ---
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
        orcamentoItens.push({ id: proximoIdItem++, nome, descricao, quantidade, valor, medidas, subtotal, imagem: imagemBase64Processada });
      }
      renderizarTabelaECalcularTotal();
      limparCamposProdutoEImagem();
      if (produtoNomeInput) produtoNomeInput.focus();
    });
  }

  if (btnCancelarEdicao)
    btnCancelarEdicao.addEventListener("click", () => {
      limparCamposProdutoEImagem();
    });

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

  function resetarFormularioCompleto() {
    limparCamposProdutoEImagem();
    if (orcamentoNumeroInput) orcamentoNumeroInput.value = "";
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

  if (btnGerarPDF) {
    btnGerarPDF.addEventListener("click", async () => {
      if (orcamentoItens.length === 0) {
        showAlert("Adicione pelo menos um item ao orçamento.");
        return;
      }
      if (typeof window.jspdf === "undefined" || typeof window.jspdf.jsPDF === "undefined" || typeof window.jspdf.jsPDF.API.autoTable === "undefined") {
        showAlert("Erro ao carregar biblioteca PDF.", "Erro");
        return;
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 14;
      let startY = 15;

      // --- Lógica de geração do PDF com as melhorias de layout ---

      // 1. Cabeçalho Timbrado
      const empresaInfo = {
        nome: "Mami Artesanato",
        cnpj: "XX.XXX.XXX/0001-XX",
        endereco: "Rua Exemplo, 123, São Paulo - SP",
        telefone: "(11) 99999-8888",
        email: "contato@mamiartesanato.com.br",
      };

      if (logoEmpresaBase64) {
        try {
          const imgProps = doc.getImageProperties(logoEmpresaBase64);
          const logoWidth = 35;
          const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
          // Logo agora está à esquerda
          doc.addImage(logoEmpresaBase64, imgProps.fileType, margin, startY, logoWidth, logoHeight);
        } catch (e) {
          console.error("Erro ao adicionar logo (Base64) ao PDF:", e);
        }
      }

      const infoX = pageWidth - margin;
      doc.setFontSize(8);
      doc.setTextColor("#312E32"); // Cinza Escuro
      doc.setFont(undefined, "bold");
      doc.text(empresaInfo.nome, infoX, startY, { align: "right" });
      doc.setFont(undefined, "normal");
      doc.text(empresaInfo.endereco, infoX, startY + 4, { align: "right" });
      doc.text(`CNPJ: ${empresaInfo.cnpj}`, infoX, startY + 8, { align: "right" });
      doc.text(`Tel: ${empresaInfo.telefone}`, infoX, startY + 12, { align: "right" });
      doc.text(`Email: ${empresaInfo.email}`, infoX, startY + 16, { align: "right" });

      startY += 25;
      doc.setDrawColor("#DEA043"); // Mostarda
      doc.setLineWidth(0.5);
      doc.line(margin, startY, pageWidth - margin, startY);
      startY += 10;

      // 2. Título do Orçamento
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#455929"); // Verde Principal
      doc.text("ORÇAMENTO", margin, startY);

      const numOrc = orcamentoNumeroInput ? orcamentoNumeroInput.value.trim() : "";
      if (numOrc) {
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.setTextColor("#312E32");
        doc.text(`Nº: ${numOrc}`, pageWidth - margin, startY, { align: "right" });
      }
      startY += 8;

      // 3. Caixa de Destaque para Dados do Cliente
      const clienteStartY = startY;
      let clienteBlockHeight = 5;
      const clienteFields = [
        { label: "Cliente", value: clienteNomeInput ? clienteNomeInput.value.trim() : "" },
        { label: "Telefone", value: clienteTelefoneInput ? clienteTelefoneInput.value.trim() : "" },
        { label: "Email", value: clienteEmailInput ? clienteEmailInput.value.trim() : "" },
        { label: "Endereço", value: clienteEnderecoInput ? clienteEnderecoInput.value.trim() : "" },
      ];
      let contentHeight = 0;
      clienteFields.forEach((field) => {
        if (field.value) {
          const textLines = doc.splitTextToSize(field.value, pageWidth - margin * 2 - 30);
          contentHeight += textLines.length * 4 + 2;
        }
      });
      clienteBlockHeight += contentHeight;

      doc.setFillColor("#455929", 0.05); // Verde Mami com 5% de opacidade
      doc.setDrawColor("#455929", 0.2);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, startY, pageWidth - margin * 2, clienteBlockHeight, 3, 3, "FD");
      startY += 5;

      doc.setFontSize(9);
      doc.setTextColor("#f2f2f2"); // Mantido escuro para legibilidade
      clienteFields.forEach((field) => {
        if (field.value) {
          doc.setFont(undefined, "bold");
          doc.text(`${field.label}:`, margin + 3, startY);
          doc.setFont(undefined, "normal");
          const textLines = doc.splitTextToSize(field.value, pageWidth - margin * 2 - 35);
          doc.text(textLines, margin + 28, startY);
          startY += textLines.length * 4 + 2;
        }
      });
      startY = clienteStartY + clienteBlockHeight + 10;

      // 4. Tabela de Itens com Estilo de Coluna
      const tableColumn = ["Img", "Nome", "Desc.", "Qtd", "V.Unit.", "Med.", "Subtotal"];
      const tableRows = [];
      orcamentoItens.forEach((item) => {
        tableRows.push([
          "",
          item.nome,
          item.descricao || "-",
          item.quantidade.toString(),
          `R$ ${item.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          item.medidas || "-",
          `R$ ${item.subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        ]);
      });

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: startY,
        theme: "striped",
        headStyles: { fillColor: "#455929", textColor: "#FFFFFF", fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2, valign: "middle", textColor: "#312E32", overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 12, minCellHeight: 12 },
          1: { cellWidth: 33 },
          2: {
            /* A largura da descrição agora será calculada automaticamente */
          }, // << LINHA MODIFICADA
          3: { cellWidth: 10, halign: "center" },
          4: { cellWidth: 20, halign: "right" },
          5: { cellWidth: 20 },
          6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
        },
        didDrawCell: (data) => {
          if (data.column.index === 0 && data.row.section === "body") {
            const item = orcamentoItens[data.row.index];
            if (item.imagem) {
              try {
                doc.addImage(item.imagem, "JPEG", data.cell.x + 1, data.cell.y + 1, 10, 10);
              } catch (e) {
                console.error("Erro img PDF:", e);
              }
            }
          }
        },
      });

      // 5. Bloco de Totais Alinhado à Esquerda
      let finalY = doc.lastAutoTable.finalY + 10;
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
      doc.text(`R$ ${subtotalItensVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
      finalY += 5;

      if (descontoPercVal > 0) {
        doc.setTextColor("#C44238");
        doc.text(`Desconto (${descontoPercVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}%):`, labelX, finalY, { align: "left" });
        doc.text(`- R$ ${valorDescontoAbs.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
        finalY += 5;
      }
      if (acrescimoAbsVal > 0) {
        doc.setTextColor("#455929");
        doc.text("Acréscimos:", labelX, finalY, { align: "left" });
        doc.text(`+ R$ ${acrescimoAbsVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, labelX + valueXOffset, finalY, { align: "left" });
        finalY += 5;
      }

      doc.setLineWidth(0.1);
      doc.line(labelX, finalY, labelX + valueXOffset + 25, finalY); // Linha separadora acima do total
      finalY += 2;

      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      doc.setTextColor("#455929");
      doc.text("Total Final:", labelX, finalY + 3, { align: "left" });
      doc.text(`R$ ${totalFinalVal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, labelX + valueXOffset, finalY + 3, { align: "left" });
      finalY += 10;

      // 6. Bloco de Pagamento
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
          finalY += textLines.length * 3.5 + 5;
        }
      });

      // 7. Rodapé Aprimorado
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageBottomY = pageHeight - 15;
        doc.setDrawColor("#DEA043");
        doc.setLineWidth(0.2);
        doc.line(margin, pageBottomY, pageWidth - margin, pageBottomY);
        doc.setFontSize(8);
        doc.setTextColor(150);
        const footerText = `${empresaInfo.telefone}  |  ${empresaInfo.email}  |  www.mamiartesanato.com.br`;
        doc.text(footerText, pageWidth / 2, pageBottomY + 5, { align: "center" });
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: "right" });
      }

      // Salvar PDF e Resetar
      let nomeArquivo = "orcamento.pdf";
      const nomeClienteVal = clienteNomeInput ? clienteNomeInput.value.trim() : "";
      if (nomeClienteVal) {
        const nomeClienteSanitizado = nomeClienteVal.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
        if (nomeClienteSanitizado) nomeArquivo = `${nomeClienteSanitizado}_orcamento.pdf`;
      }
      doc.save(nomeArquivo);
      resetarFormularioCompleto();
    });
  }

  // --- Inicialização da Página ---
  function init() {
    carregarLogoEmpresa();
    if (orcamentoNumeroInput) {
      orcamentoNumeroInput.value = "";
    }
    renderizarTabelaECalcularTotal();
    limparCamposProdutoEImagem();
  }

  init();
});
