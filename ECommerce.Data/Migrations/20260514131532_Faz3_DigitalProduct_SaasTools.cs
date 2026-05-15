using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Data.Migrations
{
    /// <inheritdoc />
    public partial class Faz3_DigitalProduct_SaasTools : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsService",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "Stock",
                table: "Products",
                newName: "LicenseType");

            migrationBuilder.AddColumn<int>(
                name: "DownloadCount",
                table: "Products",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FileUrl",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreviewUrl",
                table: "Products",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CustomerRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoreId = table.Column<int>(type: "int", nullable: false),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    City = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerRecords_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "JobRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoreId = table.Column<int>(type: "int", nullable: false),
                    CustomerRecordId = table.Column<int>(type: "int", nullable: true),
                    AppointmentId = table.Column<int>(type: "int", nullable: true),
                    Title = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ScheduledAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_JobRecords_Appointments_AppointmentId",
                        column: x => x.AppointmentId,
                        principalTable: "Appointments",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_JobRecords_CustomerRecords_CustomerRecordId",
                        column: x => x.CustomerRecordId,
                        principalTable: "CustomerRecords",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_JobRecords_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Invoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoreId = table.Column<int>(type: "int", nullable: false),
                    CustomerRecordId = table.Column<int>(type: "int", nullable: true),
                    JobRecordId = table.Column<int>(type: "int", nullable: true),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    SubTotal = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TaxAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    EInvoiceUUID = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    GibStatus = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    PdfUrl = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ReceiverName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    ReceiverTaxNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    ReceiverAddress = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: true),
                    IssuedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DueAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_CustomerRecords_CustomerRecordId",
                        column: x => x.CustomerRecordId,
                        principalTable: "CustomerRecords",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Invoices_JobRecords_JobRecordId",
                        column: x => x.JobRecordId,
                        principalTable: "JobRecords",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Invoices_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PaymentRecords",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    StoreId = table.Column<int>(type: "int", nullable: false),
                    CustomerRecordId = table.Column<int>(type: "int", nullable: true),
                    JobRecordId = table.Column<int>(type: "int", nullable: true),
                    OrderId = table.Column<int>(type: "int", nullable: true),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Method = table.Column<int>(type: "int", nullable: false),
                    Direction = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentRecords_CustomerRecords_CustomerRecordId",
                        column: x => x.CustomerRecordId,
                        principalTable: "CustomerRecords",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentRecords_JobRecords_JobRecordId",
                        column: x => x.JobRecordId,
                        principalTable: "JobRecords",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_PaymentRecords_Stores_StoreId",
                        column: x => x.StoreId,
                        principalTable: "Stores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerRecords_StoreId",
                table: "CustomerRecords",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_CustomerRecordId",
                table: "Invoices",
                column: "CustomerRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_JobRecordId",
                table: "Invoices",
                column: "JobRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_StoreId",
                table: "Invoices",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_JobRecords_AppointmentId",
                table: "JobRecords",
                column: "AppointmentId");

            migrationBuilder.CreateIndex(
                name: "IX_JobRecords_CustomerRecordId",
                table: "JobRecords",
                column: "CustomerRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_JobRecords_StoreId",
                table: "JobRecords",
                column: "StoreId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_CustomerRecordId",
                table: "PaymentRecords",
                column: "CustomerRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_JobRecordId",
                table: "PaymentRecords",
                column: "JobRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentRecords_StoreId",
                table: "PaymentRecords",
                column: "StoreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Invoices");

            migrationBuilder.DropTable(
                name: "PaymentRecords");

            migrationBuilder.DropTable(
                name: "JobRecords");

            migrationBuilder.DropTable(
                name: "CustomerRecords");

            migrationBuilder.DropColumn(
                name: "DownloadCount",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "FileUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PreviewUrl",
                table: "Products");

            migrationBuilder.RenameColumn(
                name: "LicenseType",
                table: "Products",
                newName: "Stock");

            migrationBuilder.AddColumn<bool>(
                name: "IsService",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
