plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.milkypot.tv"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.milkypot.tv"
        minSdk = 21          // Android 5.0+ cobre 99% do mercado
        targetSdk = 34
        versionCode = 7
        versionName = "1.6.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("debug")  // auto-assina com debug keystore (Android aceita em sideload)
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
        isCoreLibraryDesugaringEnabled = true   // habilita java.time em API 21+
    }
    kotlinOptions { jvmTarget = "17" }

    // Compatibilidade com TV sem Play Services — sempre pega APK universal
    packaging {
        resources {
            excludes += "META-INF/DEPENDENCIES"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.0")

    // ExoPlayer (Media3) — decoder de video nativo, leve, com loop automatico
    implementation("androidx.media3:media3-exoplayer:1.4.1")
    implementation("androidx.media3:media3-ui:1.4.1")
    implementation("androidx.media3:media3-common:1.4.1")

    // HTTP simples
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // QR code generator (~250KB, MIT)
    implementation("com.google.zxing:core:3.5.3")

    // Desugar pra usar java.time em API 21+
    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.1.4")
}
