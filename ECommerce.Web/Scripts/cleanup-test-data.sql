-- Faz0 cleanup — sadece 3 hesap ve Mehmet'in mağazası kalsın
-- Korunacak: Users (9999, 10000, 10001), Stores (ID=4), Products (ID=11,12)
USE ECommerceDb;
GO

-- Level 1 (hiçbir tablodan referans almayan)
DELETE FROM Invoices         WHERE StoreId <> 4;
DELETE FROM PaymentRecords   WHERE StoreId <> 4;
DELETE FROM JobRecords       WHERE StoreId <> 4;
DELETE FROM CustomerRecords  WHERE StoreId <> 4;
DELETE FROM RequestOffers;
DELETE FROM CustomerRequests WHERE CustomerId NOT IN (9999, 10000, 10001);
DELETE FROM WorkAreas        WHERE StoreId <> 4;
DELETE FROM Appointments     WHERE StoreId <> 4 AND CustomerId NOT IN (10001);
DELETE FROM Reviews;
DELETE FROM Messages         WHERE SenderId NOT IN (9999, 10000, 10001) OR ReceiverId NOT IN (9999, 10000, 10001);
DELETE FROM CartItems;
DELETE FROM OrderItems;

-- Level 2
DELETE FROM Carts            WHERE UserId NOT IN (9999, 10000, 10001);
DELETE FROM ServicePackages  WHERE StoreId <> 4;
DELETE FROM StoreCategories  WHERE StoreId <> 4;
DELETE FROM Orders           WHERE UserId NOT IN (9999, 10000, 10001);

-- Level 3
DELETE FROM Products         WHERE StoreId <> 4 OR StoreId IS NULL;

-- Level 4
DELETE FROM Stores           WHERE Id <> 4;

-- Level 5 (en son: Users)
DELETE FROM Users            WHERE Id NOT IN (9999, 10000, 10001);

PRINT 'Cleanup tamamlandı. Kalan: Users=' + CAST((SELECT COUNT(*) FROM Users) AS NVARCHAR(10))
    + ', Stores=' + CAST((SELECT COUNT(*) FROM Stores) AS NVARCHAR(10))
    + ', Products=' + CAST((SELECT COUNT(*) FROM Products) AS NVARCHAR(10));
