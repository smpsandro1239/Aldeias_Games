function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface SafTCompany {
  companyName: string;
  fiscalNumber: string;
  address: string;
  postalCode: string;
  city: string;
  phone?: string;
  email?: string;
}

export interface SafTInvoice {
  id: string;
  numero: string;
  hash: string;
  data: Date;
  cliente: string;
  valor: number;
  descricao: string;
  metodoPagamento: string;
}

export interface SafTParams {
  dataInicio: Date;
  dataFim: Date;
}

/**
 * SAF-T PT (v1.04_01) — gera o XML fiscal a partir de vendas (participações pagas)
 * num período. Estrutura: AuditFile > Header + MasterFiles + GeneralLedgerEntries.
 * Função pura, testável.
 */
export function buildSafeTXml(
  company: SafTCompany,
  params: SafTParams,
  invoices: SafTInvoice[]
): string {
  const now = new Date();
  const lines = invoices.map((inv, i) => {
    return [
      `<Invoice>`,
      `<InvoiceNo>${escapeXml(inv.id)}</InvoiceNo>`,
      `<DocumentStatus><InvoiceStatus>N</InvoiceStatus>`,
      `<InvoiceStatusDate>${formatDate(inv.data)}</InvoiceStatusDate>`,
      `<SourceID>${escapeXml(company.companyName)}</SourceID>`,
      `</DocumentStatus>`,
      `<InvoiceType>FT</InvoiceType>`,
      `<Hash>${escapeXml(inv.hash)}</Hash>`,
      `<InvoiceDate>${formatDate(inv.data)}</InvoiceDate>`,
      `<CustomerID>${escapeXml(inv.cliente)}</CustomerID>`,
      `<Line>`,
      `<LineNumber>${i + 1}</LineNumber>`,
      `<ProductCode>001</ProductCode>`,
      `<ProductDescription>${escapeXml(inv.descricao)}</ProductDescription>`,
      `<Quantity>1</Quantity>`,
      `<UnitOfMeasure>Un</UnitOfMeasure>`,
      `<UnitPrice>${inv.valor.toFixed(2)}</UnitPrice>`,
      `<CreditAmount>${inv.valor.toFixed(2)}</CreditAmount>`,
      `<TaxExemptionCode>M01</TaxExemptionCode>`,
      `<TaxExemptionReason>Isento com direito a dedução</TaxExemptionReason>`,
      `</Line>`,
      `<DocumentTotals>`,
      `<TotalCredit>${inv.valor.toFixed(2)}</TotalCredit>`,
      `</DocumentTotals>`,
      `</Invoice>`,
    ].join("");
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<AuditFile xmlns="urn:OECD:StandardAuditFile-Tax:PT_1.04_01">`,
    `<Header>`,
    `<AuditFileVersion>1.04_01</AuditFileVersion>`,
    `<CompanyID>${escapeXml(company.fiscalNumber)}</CompanyID>`,
    `<TaxRegistrationNumber>${escapeXml(company.fiscalNumber)}</TaxRegistrationNumber>`,
    `<TaxAccountingBasis>F</TaxAccountingBasis>`,
    `<CurrencyCode>EUR</CurrencyCode>`,
    `<DateCreated>${formatDate(now)}</DateCreated>`,
    `<StartDate>${formatDate(params.dataInicio)}</StartDate>`,
    `<EndDate>${formatDate(params.dataFim)}</EndDate>`,
    `</Header>`,
    `<MasterFiles>`,
    `<Company>`,
    `<Name>${escapeXml(company.companyName)}</Name>`,
    `<Address>`,
    `<StreetName>${escapeXml(company.address)}</StreetName>`,
    `<PostalCode>${escapeXml(company.postalCode)}</PostalCode>`,
    `<City>${escapeXml(company.city)}</City>`,
    `</Address>`,
    `<TaxRegistrationNumber>${escapeXml(company.fiscalNumber)}</TaxRegistrationNumber>`,
    `<Telephone>${escapeXml(company.phone || "")}</Telephone>`,
    `<Email>${escapeXml(company.email || "")}</Email>`,
    `</Company>`,
    `</MasterFiles>`,
    `<GeneralLedger>`,
    `<SourceDocuments>`,
    `<SalesInvoices>`,
    `<NumberOfEntries>${invoices.length}</NumberOfEntries>`,
    `<TotalCredit>${invoices.reduce((s, v) => s + v.valor, 0).toFixed(2)}</TotalCredit>`,
    lines.join("\n"),
    `</SalesInvoices>`,
    `</SourceDocuments>`,
    `</GeneralLedger>`,
    `</AuditFile>`,
  ].join("\n");

  return xml;
}

/**
 * Recolhe as vendas pagas (participações com estado 'concluido') de uma aldeia
 * no período e devolve o XML SAF-T. 'cliente' prefere dados de cliente de rua;
 * senão usa o nome do utilizador da plataforma.
 */
export async function buildSafTFromDb(
  prisma: any,
  aldeiaId: string,
  company: SafTCompany,
  params: SafTParams
): Promise<{ xml: string; count: number; total: number }> {
  const participacoes = await prisma.participacao.findMany({
    where: {
      estadoPagamento: "concluido",
      dataPagamento: { gte: params.dataInicio, lte: params.dataFim },
      jogo: { aldeiaId },
    },
    select: {
      id: true,
      valorPago: true,
      dataPagamento: true,
      createdAt: true,
      nomeCliente: true,
      hashParticipacao: true,
      hashRaspe: true,
      metodoPagamento: true,
      jogo: { select: { nome: true } },
      user: { select: { nome: true } },
    },
    orderBy: { dataPagamento: "asc" },
  });

  const invoices: SafTInvoice[] = participacoes.map((p: any) => ({
    id: p.id,
    numero: p.id.slice(-8).toUpperCase(),
    hash: p.hashParticipacao || p.hashRaspe || "",
    data: p.dataPagamento || p.createdAt,
    cliente: p.nomeCliente || p.user?.nome || "Particular",
    valor: p.valorPago,
    descricao: p.jogo?.nome || "Venda",
    metodoPagamento: p.metodoPagamento,
  }));

  const xml = buildSafeTXml(company, params, invoices);
  const total = invoices.reduce((s, v) => s + v.valor, 0);
  return { xml, count: invoices.length, total };
}