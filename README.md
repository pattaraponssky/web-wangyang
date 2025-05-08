# Website WangYang (เว็บไซต์พยากรณ์น้ำวังยาง)

โปรแกรมเว็บไซต์พยากรณ์น้ำในพื้นที่วังยาง เพื่อติดตามและติดตั้งระดับน้ำและโอกาสต่างๆ ที่สามารถดูได้

### เทคโนโลยีที่ใช้

- [Vite](https://vitejs.dev/) - เครื่องมือสร้างเว็บไซต์ที่เน้นไปที่ React
- [React](https://react.dev/) - เฟรมเวิร์คแบบ UI ที่พัฒนาโดย Facebook
- [TypeScript](https://www.typescriptlang.org/) - ภาษาโปรแกรมที่เสริมความปลอดภัยและโครงสร้างของ JavaScript
- [MUI](https://mui.com/) - โปรแกรม UI ที่ช่วยให้การพัฒนาเว็บมีประสิทธิภาพ


### การติดตั้งโปรแกรม

**1. Clone โปรเจกต์จาก GitHub**:

```sh
git clone https://github.com/pattaraponssky/web-wangyang.git
```

**2. เข้าไปที่โฟลเดอร์โปรเจกต์:**

```sh
cd web-wangyang
```

**3. เข้าไปที่โฟลเดอร์ frontend:**

```sh
cd frontend
```

**4.ติดตั้ง dependencies ที่จำเป็น:**

```sh
npm install
```

- **เริ่มโปรแกรมในโหมดการพัฒนา (Development)**

```sh
npm run dev
```

- **สร้างไฟล์เว็บไซต์สำหรับการใช้งานจริง (Production):**

```sh
npm run build
```

**จะได้ไฟล์เว็บไซต์ในโฟลเดอร์ dist นำทั้งหมดไปวางในโฟลเดอร์ server ได้เลย**

### โครงสร้างสำคัญ

- **src/components** - เมนูของคอมโพเนนต์
- **src/pages** - หน้าเพจ
- **src/assets** - สำหรับเก็บกราฟิกและภาพ
- **src/public** - สำหรับเก็บไฟล์ข้อมูลที่ใช้ในโปรเจกต์

### เพิ่มเติม

- ไฟล์ Utility.tsx ตั้งค่า API URL สำหรับการเชื่อมต่อกับ API ภายนอก และ format วันที่

---

# HEC Setup Guide (การติดตั้ง HEC)

### Program Requirement (โปรแกรมที่ต้องการ)

- **HEC-RAS 6.3**
- **HEC-DSSVue 3.3.29**
- **HEC-HMS 4.2.1**
- **Python**
- **Java (JDK 17)**
- **Xampp**

### Step 1: ติดตั้งโปรแกรม HEC ในตำแหน่งเริ่มต้น

1. **HEC-HMS 4.2.1**  
   ดาวน์โหลดและติดตั้ง HEC-HMS 4.2.1 ตามขั้นตอนที่แนะนำในเว็บไซต์ของ HEC:  
   [HEC-HMS](https://www.hec.usace.army.mil/software/hec-hms/)

2. **HEC-DSSVue 3.3.29**  
   ดาวน์โหลดและติดตั้ง HEC-DSSVue ตามขั้นตอนที่แนะนำในเว็บไซต์ของ HEC:  
   [HEC-DSSVue](https://www.hec.usace.army.mil/software/dssvue/)

3. **HEC-RAS 6.3**  
   ดาวน์โหลดและติดตั้ง HEC-RAS 6.3 ตามขั้นตอนที่แนะนำในเว็บไซต์ของ HEC:  
   [HEC-RAS](https://www.hec.usace.army.mil/software/hec-ras/)

### Step 2: ติดตั้ง Java JDK Version 17

1. ดาวน์โหลด **Java JDK 17** จาก [Oracle JDK Downloads](https://www.oracle.com/java/technologies/javase-jdk17-downloads.html)

2. ติดตั้ง Java ตามขั้นตอนที่แนะนำจาก Oracle

3. ตั้งค่า **JAVA_HOME** ในระบบ
   - เปิด **Terminal** (หรือ **Command Prompt** สำหรับ Windows)
   - ตัวอย่างการตั้งค่า **JAVA_HOME**:
     - สำหรับ **Windows**:
       1. ไปที่ **System Properties > Advanced > Environment Variables**
       2. เพิ่มตัวแปร **JAVA_HOME** ใน **System variables** และกำหนดค่าเป็นตำแหน่งที่ติดตั้ง JDK (เช่น `C:\Program Files\Java\jdk-17`)
     - สำหรับ **Linux/Mac**:
       1. เปิดไฟล์ `.bashrc` หรือ `.zshrc` แล้วเพิ่มบรรทัดนี้:

          ```bash
          export JAVA_HOME=/path/to/jdk-17
          export PATH=$JAVA_HOME/bin:$PATH
          ```

       2. ใช้คำสั่ง `source ~/.bashrc` หรือ `source ~/.zshrc` เพื่อโหลดการตั้งค่าใหม่

### Step 3: ติดตั้ง Python และไลบรารีที่จำเป็น

1. ดาวน์โหลดและติดตั้ง **Python** จาก [Python.org](https://www.python.org/downloads/)

2. ตรวจสอบการติดตั้ง Python โดยการเปิด **Command Prompt** หรือ **Terminal** และพิมพ์:

   ```bash
   python --version
   ```

3. ติดตั้ง **pywin32** ไลบรารีสำหรับเชื่อมต่อกับ HEC-RAS:

   ```bash
   pip install pywin32
   ```

##### หรือสามารถติดตั้งผ่าน Visual Studio Code ได้เลยโดยติดตั้ง Extension Python

### Step 4: ติดตั้ง XAMPP (Apache Server + PHP + MySQL)

1. ดาวน์โหลด XAMPP เวอร์ชันล่าสุดจากเว็บไซต์ทางการ : [XAMPP](https://www.apachefriends.org/download.html)
2. ติดตั้งโปรแกรม
3. เปิด XAMPP Control Panel แล้วกด Start ที่ Apache server
4. ตรวจสอบว่า Apache ทำงาน เข้าเว็บ http://localhost/ บนเบราว์เซอร์


### Step 5: นำโฟลเดอร์ `sti_wangyang` ไปไว้ในตำแหน่งไดรฟ์ `C:/`

1. คัดลอกโฟลเดอร์ `sti_wangyang` ไปยังไดรฟ์ `C:/`
2. โครงสร้างโฟลเดอร์ควรมีลักษณะเช่นนี้:

   ```
   C:/sti_wangyang
   ```

### Step 6: นำโฟลเดอร์โค้ดไปไว้ใน Apache Server

1. คัดลอกโฟลเดอร์โค้ดไปยังโฟลเดอร์ของ Apache server (เช่น `/var/www/html/` สำหรับ Linux หรือ `C:/xampp/htdocs/` สำหรับ Windows)

2. โครงสร้างโฟลเดอร์ควรมีลักษณะเช่นนี้:

   ```
   C:/xampp/htdocs/website
   C:/xampp/htdocs/wangyang/API
   C:/xampp/htdocs/wangyang/hec_api
   ```


## Additional Notes: 

### ถ้าสร้างไฟล์ csv ไม่ได้ ให้อนุญาตการสิทธิการสร้างไฟล์ให้โฟลเดอร์

- ใช้คำสั่ง `chmod` เพื่อให้สิทธิการเข้าถึงได้:

  ```bash
  chmod -R 777 /path/to/your/folder
  ```

- ถ้าเป็นระบบที่ต้องการ **สิทธิผู้ดูแลระบบ** (Linux/Mac):

  ```bash
  sudo chmod -R 777 /path/to/your/folder
  ```

### ตัวอย่าง

```bash
sudo chmod -R 777 /var/www/html/your_project_name
```
---