package com.example.attendance

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private val REQUEST_PERMISSIONS = 100
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    
    // Activity result launcher for file picker
    private val filePickerLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val data = result.data
            val uri = data?.data
            if (uri != null && fileUploadCallback != null) {
                fileUploadCallback?.onReceiveValue(arrayOf(uri))
                fileUploadCallback = null
            } else {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = null
            }
        } else {
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
        }
    }
    
    // Activity result launcher for saving files
    private val saveFileLauncher = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    ) { uri: Uri? ->
        if (uri != null) {
            // Store URI for file saving
            saveFileUri = uri
            
            // File save location is set, get Excel data from JavaScript and save it
            webView?.evaluateJavascript("""
                if (window.excelFileData) {
                    Android.saveExcelFile(window.excelFileData);
                } else {
                    console.error('No Excel data available');
                }
            """.trimIndent(), null)
        }
    }
    
    private var saveFileUri: Uri? = null
    private var pendingExcelData: String? = null
    
    private var webView: WebView? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Request permissions for file access
        requestPermissions()

        webView = findViewById(R.id.webView)
        val settings: WebSettings = webView!!.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.databaseEnabled = true
        settings.setSupportZoom(true)
        settings.builtInZoomControls = true
        settings.displayZoomControls = false

        // Enable RTL support for Arabic
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            settings.layoutAlgorithm = WebSettings.LayoutAlgorithm.TEXT_AUTOSIZING
        }

        webView!!.webViewClient = WebViewClient()
        
        // Custom WebChromeClient with file chooser support
        webView!!.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback
                
                val intent = Intent(Intent.ACTION_GET_CONTENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "*/*"
                    putExtra(Intent.EXTRA_MIME_TYPES, arrayOf(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "application/vnd.ms-excel",
                        "application/vnd.ms-excel.sheet.macroEnabled.12",
                        "application/octet-stream"
                    ))
                }
                
                try {
                    filePickerLauncher.launch(Intent.createChooser(intent, "Select Excel File"))
                } catch (e: Exception) {
                    fileUploadCallback = null
                    return false
                }
                
                return true
            }
        }
        
        // Add JavaScript interface for file saving
        webView!!.addJavascriptInterface(WebAppInterface(this), "Android")
        
        // Load the HTML file from assets
        webView!!.loadUrl("file:///android_asset/attendance-offline.html")
    }
    
    fun saveFile(fileName: String) {
        saveFileLauncher.launch(fileName)
    }
    
    fun saveExcelFile(base64Data: String) {
        if (saveFileUri != null) {
            try {
                val data = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT)
                contentResolver.openOutputStream(saveFileUri!!)?.use { outputStream ->
                    outputStream.write(data)
                    outputStream.flush()
                }
                
                // Show success message
                webView?.evaluateJavascript("""
                    (function() {
                        const indicator = document.getElementById('saveIndicator');
                        if (indicator) {
                            indicator.textContent = '✓ تم الحفظ بنجاح!';
                            indicator.style.color = '#10b981';
                            indicator.style.display = 'block';
                            setTimeout(() => {
                                indicator.style.display = 'none';
                            }, 3000);
                        }
                    })();
                """.trimIndent(), null)
                
                saveFileUri = null
            } catch (e: Exception) {
                e.printStackTrace()
                webView?.evaluateJavascript("alert('خطأ في حفظ الملف: " + e.message + "');", null)
            }
        } else {
            // Store data and request file location
            pendingExcelData = base64Data
        }
    }

    private fun requestPermissions() {
        val permissions = mutableListOf<String>()
        
        if (Build.VERSION.SDK_INT >= 33) {
            // Android 13+ (API 33+) uses READ_MEDIA_FILES
            try {
                val readMediaFiles = "android.permission.READ_MEDIA_FILES"
                if (ContextCompat.checkSelfPermission(this, readMediaFiles) 
                    != PackageManager.PERMISSION_GRANTED) {
                    permissions.add(readMediaFiles)
                }
            } catch (e: Exception) {
                // Fallback to READ_EXTERNAL_STORAGE if READ_MEDIA_FILES not available
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) 
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.READ_EXTERNAL_STORAGE)
            }
            
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) 
                != PackageManager.PERMISSION_GRANTED) {
                permissions.add(Manifest.permission.WRITE_EXTERNAL_STORAGE)
            }
        }
        
        if (permissions.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissions.toTypedArray(), REQUEST_PERMISSIONS)
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_PERMISSIONS) {
            // Permissions granted, continue
        }
    }
}
