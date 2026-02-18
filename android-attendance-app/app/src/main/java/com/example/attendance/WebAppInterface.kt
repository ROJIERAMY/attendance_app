package com.example.attendance

import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast

class WebAppInterface(private val activity: MainActivity) {
    
    @JavascriptInterface
    fun saveFile(fileName: String) {
        activity.runOnUiThread {
            activity.saveFile(fileName)
        }
    }
    
    @JavascriptInterface
    fun saveExcelFile(base64Data: String) {
        activity.runOnUiThread {
            activity.saveExcelFile(base64Data)
        }
    }
    
    @JavascriptInterface
    fun showToast(message: String) {
        activity.runOnUiThread {
            Toast.makeText(activity, message, Toast.LENGTH_SHORT).show()
        }
    }
}

