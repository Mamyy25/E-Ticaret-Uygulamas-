using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ECommerce.Data;
using ECommerce.Models;
using ECommerce.Models.Enums;
using System.Security.Claims;

namespace ECommerce.Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    [Produces("application/json")]
    public class InvoicesApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        public InvoicesApiController(ApplicationDbContext context) => _context = context;

        private async Task<Store?> GetMyStore() =>
            await _context.Stores.FirstOrDefaultAsync(s =>
                s.SellerId == int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!));

        [HttpGet]
        public async Task<ActionResult> GetAll([FromQuery] InvoiceStatus? status)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var q = _context.Invoices
                .Include(i => i.CustomerRecord)
                .Where(i => i.StoreId == store.Id);

            if (status.HasValue) q = q.Where(i => i.Status == status);

            var list = await q.OrderByDescending(i => i.IssuedAt)
                .Select(i => new {
                    i.Id, i.InvoiceNumber, i.TotalAmount, i.Type, i.Status,
                    i.ReceiverName, i.IssuedAt, i.DueAt, i.PdfUrl, i.EInvoiceUUID, i.GibStatus,
                    CustomerName = i.CustomerRecord != null ? i.CustomerRecord.FullName : null
                }).ToListAsync();

            return Ok(list);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult> GetOne(int id)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var invoice = await _context.Invoices
                .Include(i => i.CustomerRecord)
                .Include(i => i.JobRecord)
                .FirstOrDefaultAsync(i => i.Id == id && i.StoreId == store.Id);

            if (invoice == null) return NotFound();
            return Ok(invoice);
        }

        [HttpPost]
        public async Task<ActionResult> Create([FromBody] CreateInvoiceDto dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var taxAmount = dto.SubTotal * (dto.TaxRate / 100);
            var invoice = new Invoice
            {
                StoreId = store.Id,
                CustomerRecordId = dto.CustomerRecordId,
                JobRecordId = dto.JobRecordId,
                OrderId = dto.OrderId,
                InvoiceNumber = await GenerateInvoiceNumber(store.Id),
                SubTotal = dto.SubTotal,
                TaxRate = dto.TaxRate,
                TaxAmount = taxAmount,
                TotalAmount = dto.SubTotal + taxAmount,
                Type = dto.Type,
                Status = InvoiceStatus.Draft,
                ReceiverName = dto.ReceiverName,
                ReceiverTaxNumber = dto.ReceiverTaxNumber,
                ReceiverAddress = dto.ReceiverAddress,
                IssuedAt = DateTime.Now,
                DueAt = dto.DueAt,
                CreatedAt = DateTime.Now
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetOne), new { id = invoice.Id }, invoice);
        }

        [HttpPatch("{id}/status")]
        public async Task<ActionResult> UpdateStatus(int id, [FromBody] InvoiceStatusDto dto)
        {
            var store = await GetMyStore();
            if (store == null) return Forbid();

            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null || invoice.StoreId != store.Id) return NotFound();

            invoice.Status = dto.Status;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateInvoiceNumber(int storeId)
        {
            var count = await _context.Invoices.CountAsync(i => i.StoreId == storeId);
            return $"INV-{storeId:D4}-{DateTime.Now:yyyyMM}-{(count + 1):D4}";
        }
    }

    public class CreateInvoiceDto
    {
        public int? CustomerRecordId { get; set; }
        public int? JobRecordId { get; set; }
        public int? OrderId { get; set; }
        public decimal SubTotal { get; set; }
        public decimal TaxRate { get; set; } = 20;
        public InvoiceType Type { get; set; } = InvoiceType.Standard;
        public string? ReceiverName { get; set; }
        public string? ReceiverTaxNumber { get; set; }
        public string? ReceiverAddress { get; set; }
        public DateTime? DueAt { get; set; }
    }

    public class InvoiceStatusDto { public InvoiceStatus Status { get; set; } }
}
