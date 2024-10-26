let despesas = [];
let taxaCambio = null;

onload = () => {
  storagedespesas = JSON.parse(localStorage.getItem("despesas"));

  if (storagedespesas != null && storagedespesas.length > 0) {
    despesas = storagedespesas;
    calcularListaDespesas();
  }
};

function adicionar() {
  var _id = document.getElementById("id").textContent;
  var descricao = document.getElementById("descricao").value;
  var quantidade = document.getElementById("quantidade").value;
  var valor = document.getElementById("valor").value;
  var moedaOrigem = document.getElementById("moedaOrigem").value;
  var moedaDestino = document.getElementById("moedaDestino").value;
  let button = document.getElementById('add');
  button.textContent = "Adicionar";

 if (descricao && quantidade && valor && moedaOrigem && moedaDestino){
    if (_id) {
      var despesa = {
        id: _id,
        descricao: descricao,
        quantidade: quantidade,
        valor: valor,
        moedaOrigem: moedaOrigem,
        moedaDestino: moedaDestino,
      };

      var index = despesas.findIndex((e) => {
        return e.id === _id;
      });

      despesas[index] = despesa;
    } else {

      despesas.push({
        id: gerarGUID(),
        descricao: descricao,
        quantidade: quantidade,
        valor: valor,
        moedaOrigem: moedaOrigem,
        moedaDestino: moedaDestino,
      });
    }

    localStorage.setItem("despesas", JSON.stringify(despesas));

    document.getElementById("id").textContent = null;
    document.getElementById("descricao").value = null;
    document.getElementById("quantidade").value = null;
    document.getElementById("valor").value = null;
    document.getElementById('id').value = null;
  }

  obterTaxasCambio(moedaOrigem, "USD");
  calcularListaDespesas();
}

function gerarGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function calcularListaDespesas() {
  let i = 0;
  document.getElementById("despesas").innerHTML = "";

  despesas.forEach(async (despesa) => {
    let despesaRow = document.createElement("div");
    let despesaItemSubItem = document.createElement("div");
    let despesaActionSubItem = document.createElement("div");

    despesaRow.classList.add("item");
    despesaItemSubItem.classList.add("subitem");
    despesaActionSubItem.classList.add("subitem");

    let despesaDescricao = document.createElement("p");

    let despesaCalculada = await calcularDespesa(despesa.descricao, despesa.quantidade, despesa.valor, despesa.moedaOrigem, despesa.moedaDestino);
    let descricaoTitle = document.createElement("b");

    descricaoTitle.textContent= despesaCalculada.descricao;
    despesaItemSubItem.appendChild(descricaoTitle);

    let descricaoDetalhe = document.createElement("article")
    descricaoDetalhe.textContent = `Qtde: ${despesaCalculada.quantidade} | ${despesaCalculada.moedaOrigem}: ${despesaCalculada.valor} | ${despesaCalculada.moedaDestino}: ${despesaCalculada.valorCalculado} ` ;
    despesaItemSubItem.appendChild(descricaoDetalhe);

    despesaItemSubItem.appendChild(despesaDescricao);
    despesaItemSubItem.appendChild(descricaoDetalhe);

    let deleteButton = gerarBotaoDelete(despesa, i);
    let editButton = gerarBotaoEditar(despesa, i);

    despesaActionSubItem.appendChild(editButton);
    despesaActionSubItem.appendChild(deleteButton);
    despesaActionSubItem.id = 'action';

    despesaRow.appendChild(despesaItemSubItem)
    despesaRow.appendChild(despesaActionSubItem)
    
    document.getElementById("despesas").appendChild(despesaRow);

    i++;
  });

  await calcularTotal();
}

function gerarBotaoEditar(despesa, index) {
  let editButton = document.createElement("a");

  editButton.type = "button";
  editButton.value = index;

  editButton.onclick = function () {
    var despesaId = document.getElementById('id');
    despesaId.textContent = despesa.id;
    
    let button = document.getElementById('add');
    button.textContent = "Atualizar";

    document.getElementById("descricao").value = despesa.descricao;
    document.getElementById("quantidade").value = despesa.quantidade;
    document.getElementById("valor").value = despesa.valor;
    document.getElementById("moedaOrigem").value = despesa.moedaOrigem;
    document.getElementById("moedaDestino").value = despesa.moedaDestino;
  };

  let editIcon = document.createElement("img");
  editIcon.src = "image/icons/icon-editar.png";
  editIcon.style.width = "20px";
  editIcon.style.height = "20px";

  editButton.appendChild(editIcon);

  return editButton;
}

function gerarBotaoDelete(despesa, index) {
  let deleteButton = document.createElement("a");
  deleteButton.type = "button";
  deleteButton.value = index;
  deleteButton.onclick = function () {
    var despesaList = document.getElementById("despesas");
    var id = despesa.id;
    if(confirm(`Deseja realmente excluir "${despesa.descricao}"`)){
      despesaList.children[this.value].remove();
      var index = despesas.findIndex((e) => {
        return e.id === id;
      });
      despesas.splice(index, 1);
      localStorage.setItem("despesas", JSON.stringify(despesas));
      calcularListaDespesas();
    }
  };
  let deleteIcon = document.createElement("img");
  deleteIcon.src = "image/icons/deletar.png";
  deleteIcon.style.width = "20px";
  deleteIcon.style.height = "20px";

  deleteButton.appendChild(deleteIcon);

  return deleteButton;
}

async function calcularTotal() {
  let totalOrigem = 0;
  let totalDestino = 0;

  const promises = despesas.map(async (despesa) => {
    await obterTaxasCambio(
      despesa.moedaOrigem,
      despesa.moedaDestino
    );
    totalOrigem += despesa.quantidade * taxaCambio[despesa.moedaOrigem] * despesa.valor;
    totalDestino += despesa.quantidade * taxaCambio[despesa.moedaDestino] * despesa.valor;
  });

  await Promise.all(promises);

  document.getElementById("total").innerHTML = "";
  let totalCard = document.createElement("div");

  let totalOrigemdescricao = document.createElement("p");
  totalOrigemdescricao.textContent = `Total [Moeda de Origem]: ${totalOrigem}`;

  let totalDestinodescricao = document.createElement("p");
  totalDestinodescricao.textContent = `Total [Moeda de Destino]: ${totalDestino}`;

  totalCard.appendChild(totalOrigemdescricao);
  totalCard.appendChild(totalDestinodescricao);

  document.getElementById("total").appendChild(totalCard);
}

async function calcularDespesa(descricao, quantidade, valor, moedaOrigem, moedaDestino) {
  let exchangeRate = await obterTaxasCambio(
    moedaOrigem,
    moedaDestino
  );

  let valorCalculado = quantidade * valor * exchangeRate;

  return {descricao, quantidade, valor, valorCalculado, moedaOrigem, moedaDestino}
}

async function obterTaxasCambio(moedaOrigem, moedaDestino) {
  try {
    let response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${moedaOrigem}`
    );
    let data = await response.json();
    taxaCambio = data.rates;

    return await taxaCambio[moedaDestino];
  } catch (err) {
    console.error(err);
  }
}