# Urgent Backend Bug Report: 403 Forbidden on All Endpoints

**Author:** Mobile App Development Team  
**Date:** September 2026  
**Target:** Backend Development Team & DevOps / Server Administrator  
**Domain in Scope:** `https://backend-code.se-batch-2022.com`  
**Severity:** Critical (Blocks all mobile app REST API communication)

---

## 1. Executive Summary

Every HTTP/HTTPS request sent to `https://backend-code.se-batch-2022.com` is currently blocked by the web server with **`403 Forbidden`** (returning raw Apache HTML instead of API JSON).

This is **not an application-level or routing error** (the request is rejected by Apache/Nginx before it reaches PHP/Laravel/CodeIgniter index.php).

---

## 2. Evidence & Live Test Results

When calling any endpoint via standard HTTPS `fetch` or `curl`:

### Test Command:
```bash
curl -i https://backend-code.se-batch-2022.com/public/index.php/api/devices
```

### Raw Server Response:
```http
HTTP/1.1 403 Forbidden
Date: Mon, 21 Sep 2026 18:07:44 GMT
Server: Apache
Content-Type: text/html; charset=iso-8859-1

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html><head>
<title>403 Forbidden</title>
</head><body>
<h1>Forbidden</h1>
<p>You don't have permission to access this resource.</p>
</body></html>
```

### Probed Paths (All Blocked with 403):
| Endpoint Tested | Response Status | Content-Type |
|---|---|---|
| `GET /` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/devices` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/devices/energy/status` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/sensors/energy/latest` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/sensors/energy/stats?period=daily` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/bills/energy/mtd` | `403 Forbidden` | `text/html` (Apache error page) |
| `GET /public/index.php/api/bills/energy/config` | `403 Forbidden` | `text/html` (Apache error page) |

---

## 3. Root Cause & How to Fix

Because the response is the default Apache HTML page (`You don't have permission to access this resource`), please check the following server configurations:

### Cause 1: Linux File / Folder Permissions (Most Common on cPanel/VPS)
The web server user (`www-data`, `apache`, or `nobody`) must have read & execute permissions on the project directory:
```bash
# In the project root on the server:
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod -R 775 storage bootstrap/cache  # (if Laravel)
chown -R www-data:www-data .          # or your cPanel user
```

### Cause 2: Apache `.htaccess` or VirtualHost `Require all granted`
In your Apache VirtualHost or `.htaccess`:
```apache
<Directory "/path/to/public">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
```
*Make sure there is no old Apache 2.2 syntax like `Order deny,allow \ Deny from all` or IP-blocking rules.*

### Cause 3: ModSecurity / Web Application Firewall (WAF)
If ModSecurity is enabled on the server/cPanel:
- Check the Apache error log (`/var/log/apache2/error.log` or cPanel **Metrics > Errors**).
- ModSecurity may be flagging standard mobile/REST requests and dropping them with a 403 rule.

### Cause 4: DocumentRoot Pointing
Ensure the domain's **DocumentRoot** points directly to the `public/` directory rather than the repository root.

---

## 4. Expected Behavior Once Fixed

When the permissions or Apache directives are corrected, a GET request to:
```
GET https://backend-code.se-batch-2022.com/public/index.php/api/devices
```
should return a `200 OK` JSON response:
```json
{
  "status": "success",
  "data": [
    {
      "id": "1",
      "device_id": "energy",
      "device_name": "Main Meter",
      "status": "active"
    }
  ],
  "message": "Devices retrieved successfully"
}
```
Please let us know once server access is restored so we can verify the live app against the new MTD and Analytics endpoints!
