using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProductModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsFeatured",
                table: "Products",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "IsFeatured" },
                values: new object[] { new DateTime(2026, 4, 19, 22, 7, 28, 788, DateTimeKind.Local).AddTicks(8740), false });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "IsFeatured" },
                values: new object[] { new DateTime(2026, 4, 19, 22, 7, 28, 788, DateTimeKind.Local).AddTicks(8764), false });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "IsFeatured" },
                values: new object[] { new DateTime(2026, 4, 19, 22, 7, 28, 788, DateTimeKind.Local).AddTicks(8766), false });

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "IsFeatured" },
                values: new object[] { new DateTime(2026, 4, 19, 22, 7, 28, 788, DateTimeKind.Local).AddTicks(8768), false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsFeatured",
                table: "Products");

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 29, 20, 26, 23, 175, DateTimeKind.Local).AddTicks(5524));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 29, 20, 26, 23, 175, DateTimeKind.Local).AddTicks(5615));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 29, 20, 26, 23, 175, DateTimeKind.Local).AddTicks(5618));

            migrationBuilder.UpdateData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2026, 3, 29, 20, 26, 23, 175, DateTimeKind.Local).AddTicks(5621));
        }
    }
}
