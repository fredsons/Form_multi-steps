$(document).ready(function() {
  // Variáveis de controle
  let currentStep = 1;
  const totalSteps = 4;
  let formChanged = false;
  let autoSaveTimer;
  const STORAGE_KEY = 'event_registration_form';
  
  // Aplicar máscaras aos campos usando jQuery Mask Plugin
  $('#cpf').mask('000.000.000-00', {
      onComplete: function(cpf) {
          validateCPF(cpf);
      },
      onKeyPress: function(cpf) {
          const valid = validateCPF(cpf);
          if (valid) {
              $('#cpf').addClass('is-mask-valid').removeClass('is-invalid');
          } else {
              $('#cpf').removeClass('is-mask-valid');
          }
      }
  });
  
  $('#telefone').mask('(00) 00000-0000');
  $('#cep').mask('00000-000');
  
  // Setup do botão para buscar CEP
  $('#buscar-cep').on('click', function() {
      const cep = $('#cep').val().replace(/\D/g, '');
      if (cep.length !== 8) {
          alert('Por favor, insira um CEP válido.');
          return;
      }
      
      // Mostrar loader
      $(this).html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>');
      
      // Fazer requisição para a API ViaCEP
      $.getJSON(`https://viacep.com.br/ws/${cep}/json/`, function(data) {
          if (!data.erro) {
              $('#rua').val(data.logradouro);
              $('#bairro').val(data.bairro);
              $('#cidade').val(data.localidade);
              $('#estado').val(data.uf);
              // Foca no campo de número após preencher o endereço
              $('#numero').focus();
          } else {
              alert('CEP não encontrado.');
          }
      }).fail(function() {
          alert('Erro ao buscar o CEP. Tente novamente mais tarde.');
      }).always(function() {
          // Restaurar o botão
          $('#buscar-cep').html('<i class="fas fa-search"></i>');
      });
  });
  
  // Funções de navegação entre etapas com animações avançadas
  function showStep(stepNumber, direction) {
      // Oculta todas as etapas
      const currentContent = $(`.step-content[data-step="${currentStep}"]`);
      
      // Remove as classes de animação anteriores
      $('.step-content').removeClass('step-enter-left step-enter-right animate__animated animate__fadeIn');
      
      // Aplica a animação apropriada com base na direção
      const newContent = $(`.step-content[data-step="${stepNumber}"]`);
      
      if (direction === 'next') {
          newContent.addClass('animate__animated animate__fadeIn step-enter-right');
      } else if (direction === 'prev') {
          newContent.addClass('animate__animated animate__fadeIn step-enter-left');
      } else {
          newContent.addClass('animate__animated animate__fadeIn');
      }
      
      // Oculta todas as etapas e mostra apenas a atual
      $('.step-content').removeClass('active');
      newContent.addClass('active');
      
      // Atualiza os indicadores de etapa
      $('.step').removeClass('active');
      $('.step').each(function() {
          let step = $(this).data('step');
          if (step < stepNumber) {
              $(this).addClass('completed');
          } else if (step === stepNumber) {
              $(this).addClass('active');
          } else {
              $(this).removeClass('completed');
          }
      });
      
      // Atualiza a barra de progresso com animação
      const progressPercentage = ((stepNumber - 1) / (totalSteps - 1)) * 100;
      $('.progress-bar').css('width', progressPercentage + '%').attr('aria-valuenow', progressPercentage);
      
      // Mostra/esconde os botões de navegação
      if (stepNumber === 1) {
          $('#prevBtn').hide();
      } else {
          $('#prevBtn').show();
      }
      
      if (stepNumber === totalSteps) {
          $('#nextBtn').hide();
          $('#submitBtn').show();
          // Popula o resumo com os dados do formulário
          populateReviewSection();
      } else {
          $('#nextBtn').show();
          $('#submitBtn').hide();
      }
      
      // Atualiza a etapa atual
      currentStep = stepNumber;
  }
  
  // Função para validar CPF
  function validateCPF(cpf) {
      cpf = cpf.replace(/[^\d]+/g, '');
      
      // Verifica se tem 11 dígitos
      if (cpf.length !== 11) {
          $('#cpf-feedback').text('CPF deve conter 11 dígitos.');
          return false;
      }
      
      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cpf)) {
          $('#cpf-feedback').text('CPF inválido.');
          return false;
      }
      
      // Calcula o primeiro dígito verificador
      let sum = 0;
      for (let i = 0; i < 9; i++) {
          sum += parseInt(cpf.charAt(i)) * (10 - i);
      }
      
      let remainder = sum % 11;
      const digit1 = remainder < 2 ? 0 : 11 - remainder;
      
      if (parseInt(cpf.charAt(9)) !== digit1) {
          $('#cpf-feedback').text('CPF inválido.');
          return false;
      }
      
      // Calcula o segundo dígito verificador
      sum = 0;
      for (let i = 0; i < 10; i++) {
          sum += parseInt(cpf.charAt(i)) * (11 - i);
      }
      
      remainder = sum % 11;
      const digit2 = remainder < 2 ? 0 : 11 - remainder;
      
      if (parseInt(cpf.charAt(10)) !== digit2) {
          $('#cpf-feedback').text('CPF inválido.');
          return false;
      }
      
      $('#cpf-feedback').text('CPF válido.');
      return true;
  }
  
  // Validação avançada da etapa atual antes de prosseguir
  function validateCurrentStep() {
      let isValid = true;
      const currentFields = $(`.step-content[data-step="${currentStep}"]`).find('[required]');
      
      // Remove classes de validação anteriores
      currentFields.removeClass('is-invalid');
      
      // Verifica cada campo obrigatório
      currentFields.each(function() {
          const $field = $(this);
          
          // Validações específicas por tipo de campo
          if ($field.attr('type') === 'email') {
              const emailRegex = /^(([^()\[\]\\.,;:\s@"]+(\.[^()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
              if (!emailRegex.test($field.val())) {
                  $field.addClass('is-invalid');
                  isValid = false;
              }
          } else if ($field.attr('id') === 'nome') {
              if ($field.val().trim().length < 5) {
                  $field.addClass('is-invalid');
                  isValid = false;
              }
          } else if ($field.attr('id') === 'cpf') {
              if (!validateCPF($field.val())) {
                  $field.addClass('is-invalid');
                  isValid = false;
              }
          } else if ($field.val() === '') {
              $field.addClass('is-invalid');
              isValid = false;
          }
      });
      
      // Validações específicas por etapa
      if (currentStep === 2 && isValid) {
          // Verifica se os emails conferem
          const email = $('#email').val();
          const confirmEmail = $('#confirmar_email').val();
          
          if (email !== confirmEmail) {
              $('#confirmar_email').addClass('is-invalid');
              isValid = false;
          }
      }
      
      return isValid;
  }
  
  // Função para salvar dados no localStorage
  function saveFormData() {
      if (!formChanged) return;
      
      const formData = {};
      
      // Coleta dados de inputs text, email, tel, date
      $('input[type="text"], input[type="email"], input[type="tel"], input[type="date"]').each(function() {
          formData[$(this).attr('name')] = $(this).val();
      });
      
      // Coleta dados de selects
      $('select').each(function() {
          formData[$(this).attr('name')] = $(this).val();
      });
      
      // Coleta dados de textareas
      $('textarea').each(function() {
          formData[$(this).attr('name')] = $(this).val();
      });
      
      // Coleta dados de checkboxes
      formData.workshops = [];
      $('input[name="workshops"]:checked').each(function() {
          formData.workshops.push($(this).val());
      });
      
      // Coleta dados de outros checkboxes individuais
      $('input[type="checkbox"]:not([name="workshops"])').each(function() {
          formData[$(this).attr('name')] = $(this).is(':checked');
      });
      
      // Salva no localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
          formData: formData,
          lastSaved: new Date().toISOString(),
          currentStep: currentStep
      }));
      
      // Atualiza flag de alterações
      formChanged = false;
      
      // Exibe indicador de salvamento
      showSavingIndicator();
  }
  
  // Carrega dados salvos no localStorage
  function loadFormData() {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (!savedData) return false;
      
      try {
          const data = JSON.parse(savedData);
          const formData = data.formData;
          
          // Preenche campos de texto, email, tel, date
          for (const field in formData) {
              if (field === 'workshops' || field === 'termos' || field === 'newsletter') continue;
              $(`[name="${field}"]`).val(formData[field]);
          }
          
          // Marca checkboxes de workshops
          if (formData.workshops && formData.workshops.length) {
              formData.workshops.forEach(workshop => {
                  $(`input[value="${workshop}"]`).prop('checked', true);
              });
          }
          
          // Marca outros checkboxes
          if (formData.termos) $('#termos').prop('checked', formData.termos);
          if (formData.newsletter) $('#newsletter').prop('checked', formData.newsletter);
          
          // Move para a etapa salva
          if (data.currentStep && data.currentStep > 1) {
              showStep(data.currentStep, 'none');
          }
          
          // Exibe alerta de recuperação
          $('#recovery-alert').show();
          
          return true;
      } catch (e) {
          console.error('Erro ao carregar dados salvos:', e);
          return false;
      }
  }
  
  // Limpa todos os dados do formulário e localStorage
  function clearFormData() {
      $('#multi-step-form').trigger('reset');
      localStorage.removeItem(STORAGE_KEY);
      showStep(1, 'none');
      formChanged = false;
      
      // Limpa também classes de validação
      $('.is-invalid').removeClass('is-invalid');
      $('.is-mask-valid').removeClass('is-mask-valid');
  }
  
  // Exibe indicador de salvamento automático
  function showSavingIndicator() {
      // Criar o indicador se não existir
      if ($('.saving-indicator').length === 0) {
          $('body').append('<div class="saving-indicator"><i class="fas fa-save"></i> Progresso salvo</div>');
      }
      
      // Mostrar o indicador
      $('.saving-indicator').addClass('show');
      
      // Esconder após alguns segundos
      setTimeout(function() {
          $('.saving-indicator').removeClass('show');
      }, 2000);
  }
  
  // Popula a seção de revisão com os dados do formulário
  function populateReviewSection() {
      // Informações Pessoais
      const pessoalHtml = `
          <p><strong>Nome:</strong> <span>${$('#nome').val()}</span></p>
          <p><strong>Data de Nascimento:</strong> <span>${formatDate($('#data_nascimento').val())}</span></p>
          <p><strong>Gênero:</strong> <span>${$('#genero option:selected').text() || 'Não informado'}</span></p>
          <p><strong>CPF:</strong> <span>${$('#cpf').val()}</span></p>
          <p><strong>Nacionalidade:</strong> <span>${$('#nacionalidade').val() || 'Não informado'}</span></p>
      `;
      $('#review-personal').html(pessoalHtml);
      
      // Informações de Contato
      let enderecoCompleto = "";
      if ($('#rua').val()) {
          enderecoCompleto += $('#rua').val();
          if ($('#numero').val()) enderecoCompleto += `, ${$('#numero').val()}`;
          if ($('#complemento').val()) enderecoCompleto += ` - ${$('#complemento').val()}`;
          if ($('#bairro').val()) enderecoCompleto += `, ${$('#bairro').val()}`;
          if ($('#cidade').val()) enderecoCompleto += `, ${$('#cidade').val()}`;
          if ($('#estado').val()) enderecoCompleto += ` - ${$('#estado').val()}`;
          if ($('#cep').val()) enderecoCompleto += `, CEP: ${$('#cep').val()}`;
      } else {
          enderecoCompleto = "Não informado";
      }
      
      const contatoHtml = `
          <p><strong>Email:</strong> <span>${$('#email').val()}</span></p>
          <p><strong>Telefone:</strong> <span>${$('#telefone').val()}</span></p>
          <p><strong>Endereço:</strong> <span>${enderecoCompleto}</span></p>
      `;
      $('#review-contact').html(contatoHtml);
      
      // Preferências do Evento
      let workshopsSelected = [];
      $('input[name="workshops"]:checked').each(function() {
          workshopsSelected.push($(this).next('label').text().trim());
      });
      
      // Obtém preço do ingresso selecionado
      let tipoIngressoTexto = $('#tipo_ingresso option:selected').text();
      let precoIngresso = 0;
      
      if (tipoIngressoTexto.includes('Básico')) {
          precoIngresso = 100;
      } else if (tipoIngressoTexto.includes('VIP')) {
          precoIngresso = 250;
      } else if (tipoIngressoTexto.includes('Premium')) {
          precoIngresso = 400;
      }
      
      const preferencesHtml = `
          <p><strong>Tipo de Ingresso:</strong> <span>${tipoIngressoTexto || 'Não selecionado'}</span></p>
          <p><strong>Método de Pagamento:</strong> <span>${$('#metodo_pagamento option:selected').text() || 'Não selecionado'}</span></p>
          <p><strong>Workshops:</strong> <span>${workshopsSelected.length ? workshopsSelected.join('<br>') : 'Nenhum selecionado'}</span></p>
          <p><strong>Observações:</strong> <span>${$('#observacoes').val() || 'Nenhuma'}</span></p>
          <p><strong>Newsletter:</strong> <span>${$('#newsletter').is(':checked') ? 'Sim' : 'Não'}</span></p>
      `;
      $('#review-preferences').html(preferencesHtml);
      
      // Popula resumo de valores
      let pricingHtml = `<p><span>Ingresso ${tipoIngressoTexto.split('-')[0].trim()}:</span> <span>R$ ${precoIngresso.toFixed(2)}</span></p>`;
      
      // Adiciona workshops se houver custo adicional
      if (workshopsSelected.length > 0) {
          // Supomos que cada workshop custa R$ 50
          const workshopUnitPrice = 50;
          const workshopTotalPrice = workshopsSelected.length * workshopUnitPrice;
          pricingHtml += `<p><span>Workshops (${workshopsSelected.length}):</span> <span>R$ ${workshopTotalPrice.toFixed(2)}</span></p>`;
          
          // Atualiza o preço total
          precoIngresso += workshopTotalPrice;
      }
      
      $('#pricing-summary').html(pricingHtml);
      $('#total-price').text(`R$ ${precoIngresso.toFixed(2)}`);
  }
  
  // Função para formatar data (yyyy-mm-dd para dd/mm/yyyy)
  function formatDate(dateString) {
      if (!dateString) return '';
      const parts = dateString.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  
  // Evento para detectar mudanças no formulário
  $('form :input').on('change input', function() {
      formChanged = true;
      
      // Inicia ou reseta o timer de salvamento automático (a cada 30 segundos)
      clearTimeout(autoSaveTimer);
      autoSaveTimer = setTimeout(saveFormData, 30000);
  });
  
  // Evento de clique no botão "Próximo"
  $('#nextBtn').click(function() {
      if (validateCurrentStep()) {
          const newStep = currentStep + 1;
          showStep(newStep, 'next');
          saveFormData(); // Salva dados ao avançar
      } else {
          // Anima o botão para indicar erro
          $(this).removeClass('animate__animated animate__shakeX')
              .addClass('animate__animated animate__shakeX');
          setTimeout(() => {
              $(this).removeClass('animate__animated animate__shakeX');
          }, 1000);
      }
  });
  
  // Evento de clique no botão "Anterior"
  $('#prevBtn').click(function() {
      const newStep = currentStep - 1;
      showStep(newStep, 'prev');
  });
  
  // Evento de clique no botão "Salvar Progresso"
  $('#saveProgressBtn').click(function() {
      saveFormData();
      // Feedback visual de salvamento
      $(this).html('<i class="fas fa-check me-2"></i>Salvo!');
      setTimeout(function() {
          $('#saveProgressBtn').html('<i class="fas fa-save me-2"></i>Salvar Progresso');
      }, 2000);
  });
  
  // Evento de clique no botão "Limpar Dados"
  $('#clearFormBtn').click(function() {
      // Exibe o modal de confirmação
      $('#clearDataModal').modal('show');
  });
  
  // Confirma limpeza de dados
  $('#confirmClearBtn').click(function() {
      clearFormData();
      $('#clearDataModal').modal('hide');
  });
  
  // Evento de submissão do formulário
  $('#multi-step-form').submit(function(e) {
      e.preventDefault();
      
      // Valida a última etapa
      if (!validateCurrentStep()) {
          return;
      }
      
      // Verifica se os termos foram aceitos
      if (!$('#termos').is(':checked')) {
          $('#termos').addClass('is-invalid');
          return;
      }
      
      // Recolhe todos os dados do formulário
      const formData = new FormData(this);
      
      // Preparar dados para envio (poderia ser em JSON também)
      const dataObject = {};
      for (let [key, value] of formData.entries()) {
          if (dataObject[key]) {
              // Se a chave já existe, transforma em array
              if (!Array.isArray(dataObject[key])) {
                  dataObject[key] = [dataObject[key]];
              }
              dataObject[key].push(value);
          } else {
              dataObject[key] = value;
          }
      }
      
      // Adiciona os workshops selecionados
      dataObject.workshops = [];
      $('input[name="workshops"]:checked').each(function() {
          dataObject.workshops.push($(this).val());
      });
      
      // Mostrar indicador de carregamento no botão
      $('#submitBtn').prop('disabled', true).html('<i class="fas fa-spinner fa-spin me-2"></i>Enviando...');
      
      // Simulação de envio do formulário (aqui seria uma requisição AJAX real)
      setTimeout(function() {
          // Simulando resposta de sucesso
          console.log("Dados enviados:", dataObject);
          
          // Limpa os dados salvos no localStorage
          localStorage.removeItem(STORAGE_KEY);
          
          // Exibir mensagem de sucesso
          $('.card-body').html(`
              <div class="text-center py-5 animate__animated animate__fadeIn">
                  <i class="fas fa-check-circle text-success fa-5x mb-3"></i>
                  <h2>Inscrição Confirmada!</h2>
                  <p class="lead">Sua inscrição no evento foi realizada com sucesso.</p>
                  <p>Um email de confirmação foi enviado para ${$('#email').val()}.</p>
                  <p>Seu número de inscrição é: <strong>${generateRegistrationNumber()}</strong></p>
                  <div class="mt-4">
                      <button type="button" class="btn btn-primary me-2" onclick="window.location.reload();">
                          <i class="fas fa-plus-circle me-2"></i>Nova Inscrição
                      </button>
                      <button type="button" class="btn btn-outline-success" onclick="window.print();">
                          <i class="fas fa-print me-2"></i>Imprimir Comprovante
                      </button>
                  </div>
              </div>
          `);
      }, 2000);
  });
  
  // Função para gerar número de inscrição fictício
  function generateRegistrationNumber() {
      const date = new Date();
      const year = date.getFullYear().toString().substr(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `REG-${year}${month}-${random}`;
  }
  
  // Ao abrir o site, verifica se há dados salvos
  if (!loadFormData()) {
      // Se não houver dados salvos, inicia na primeira etapa
      showStep(1, 'none');
  }
  
  // Salvar automaticamente antes de sair da página
  $(window).on('beforeunload', function() {
      if (formChanged) {
          saveFormData();
          return 'Há alterações não salvas. Tem certeza que deseja sair?';
      }
  });
});