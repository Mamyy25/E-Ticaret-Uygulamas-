using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ECommerce.Data.Migrations
{
    /// <inheritdoc />
    public partial class Faz0_UserTypeEnum_SubscriptionPlan : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DropColumn(
                name: "IsAdmin",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsSeller",
                table: "Users");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubscriptionExpiresAt",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubscriptionPlan",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "UserType",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            // StoreType: string → int enum dönüşümü
            migrationBuilder.Sql("ALTER TABLE [Stores] ADD [StoreType_New] int NOT NULL DEFAULT 0;");
            migrationBuilder.Sql("UPDATE [Stores] SET [StoreType_New] = CASE [StoreType] WHEN 'Physical' THEN 0 WHEN 'Service' THEN 1 WHEN 'Online' THEN 2 ELSE 0 END;");
            // Default constraint varsa düşür
            migrationBuilder.Sql(@"
                DECLARE @cname nvarchar(256);
                SELECT @cname = [d].[name]
                FROM [sys].[default_constraints] [d]
                JOIN [sys].[columns] [c] ON [d].[parent_column_id] = [c].[column_id] AND [d].[parent_object_id] = [c].[object_id]
                WHERE [d].[parent_object_id] = OBJECT_ID(N'[Stores]') AND [c].[name] = N'StoreType';
                IF @cname IS NOT NULL EXEC(N'ALTER TABLE [Stores] DROP CONSTRAINT [' + @cname + N'];');
            ");
            migrationBuilder.Sql("ALTER TABLE [Stores] DROP COLUMN [StoreType];");
            migrationBuilder.Sql("EXEC sp_rename 'Stores.StoreType_New', 'StoreType', 'COLUMN';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubscriptionExpiresAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "SubscriptionPlan",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "UserType",
                table: "Users");

            migrationBuilder.AddColumn<bool>(
                name: "IsAdmin",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsSeller",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<string>(
                name: "StoreType",
                table: "Stores",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CategoryId", "CreatedAt", "Description", "ImageUrl", "IsActive", "IsDeleted", "IsFeatured", "IsService", "Keywords", "Name", "Price", "Stock", "StoreCategoryId", "StoreId", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, 1, new DateTime(2026, 4, 26, 14, 27, 28, 204, DateTimeKind.Local).AddTicks(3915), "15.6 inch ekran, 16GB RAM", null, true, false, false, false, null, "Laptop", 15000m, 10, null, null, null },
                    { 2, 1, new DateTime(2026, 4, 26, 14, 27, 28, 204, DateTimeKind.Local).AddTicks(3940), "Kablosuz optik mouse", null, true, false, false, false, null, "Wireless Mouse", 250m, 50, null, null, null },
                    { 3, 2, new DateTime(2026, 4, 26, 14, 27, 28, 204, DateTimeKind.Local).AddTicks(3942), "Pamuklu tişört", null, true, false, false, false, null, "T-Shirt", 150m, 100, null, null, null },
                    { 4, 3, new DateTime(2026, 4, 26, 14, 27, 28, 204, DateTimeKind.Local).AddTicks(4060), "Bestseller roman", null, true, false, false, false, null, "Roman Kitabı", 75m, 30, null, null, null }
                });
        }
    }
}
