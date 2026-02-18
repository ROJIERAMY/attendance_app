// Shared attendance & grades logic for both online and offline HTML versions
// يعتمد على وجود مكتبة XLSX محمّلة قبله (assets/js/xlsx.full.min.js)

const NAME_HEADERS = ['الاسم الثلاثى', 'الاسم الثلاثي', 'الاسم'];
const DATE_HEADER_REGEX = /^\d{1,2}\/\d{1,2}\/\d{2}$/;

// Mapping for grade-related headers
const GRADE_HEADER_MAP = {
  total: 'المجموع',
  attendanceGrade: 'درجة الحضور',
  attendanceCount: 'عدد مرات الحضور',
  hymns: 'درجة الالحان',
  coptic: 'درجة القبطى',
  rites: 'درجة الطقس'
};

let workbookHeaders = [];
let workbookRows = [];
let dateColumns = [];
let dateColumnIndexes = [];
let gradeColumnIndexes = {};
let nameColumnIndex = -1;
let rankColumnIndex = -1;
let classColumnIndex = -1;
let phoneColumnIndex = -1;
let genderColumnIndex = -1;
let ageColumnIndex = -1;

let students = [];
let currentStudents = [];
let originalFileName = '';
let workbook = null; // Store workbook for auto-save

function normalizeHeader(value) {
  return (value ?? '').toString().replace(/\s+/g, ' ').trim();
}

function normalizeCell(value) {
  if (value === undefined || value === null) return '';
  return value;
}

function detectDateColumns(headers) {
  const indexes = [];
  headers.forEach((header, idx) => {
    if (DATE_HEADER_REGEX.test(normalizeHeader(header))) {
      indexes.push(idx);
    }
  });
  return indexes;
}

function findColumnIndex(headers, keywords, fallback = -1) {
  const normalized = headers.map(normalizeHeader);
  const list = Array.isArray(keywords) ? keywords : [keywords];
  for (const keyword of list) {
    const idx = normalized.findIndex((header) => header.includes(keyword));
    if (idx !== -1) {
      return idx;
    }
  }
  return fallback;
}

function normalizeAttendance(value) {
  if (value === '' || value === null || value === undefined) {
    return '';
  }
  const num = Number(value);
  return Number.isNaN(num) ? '' : num;
}

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  originalFileName = file.name;
  const fileNameSpan = document.getElementById('fileName');
  if (fileNameSpan) fileNameSpan.textContent = file.name;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = new Uint8Array(e.target.result);
      workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      processExcelData(jsonData);
    } catch (error) {
      alert('خطأ في قراءة الملف: ' + error.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function processExcelData(data) {
  if (!data || data.length < 2) {
    alert('ملف غير صالح. تأكد من وجود بيانات.');
    return;
  }

  workbookHeaders = data[0].map((cell) => normalizeCell(cell));
  workbookRows = data
    .slice(1)
    .map((row) => workbookHeaders.map((_, idx) => normalizeCell(row[idx])));

  nameColumnIndex = findColumnIndex(workbookHeaders, NAME_HEADERS, workbookHeaders.length - 1);
  rankColumnIndex = findColumnIndex(workbookHeaders, 'الرتبة الشماسية');
  classColumnIndex = findColumnIndex(workbookHeaders, 'السنة الدراسية');

  // Extra info columns
  phoneColumnIndex = findColumnIndex(workbookHeaders, 'رقم التليفون');
  genderColumnIndex = findColumnIndex(workbookHeaders, 'النوع');
  ageColumnIndex = findColumnIndex(workbookHeaders, 'السن');

  // Grade columns
  gradeColumnIndexes = {};
  Object.entries(GRADE_HEADER_MAP).forEach(([key, label]) => {
    gradeColumnIndexes[key] = findColumnIndex(workbookHeaders, label, -1);
  });

  dateColumnIndexes = detectDateColumns(workbookHeaders);
  dateColumns = dateColumnIndexes.map((idx) => normalizeHeader(workbookHeaders[idx]));

  students = workbookRows
    .map((row, rowIndex) => buildStudent(row, rowIndex))
    .filter(Boolean);

  students.forEach((student, idx) => {
    student.id = idx + 1;
  });

  currentStudents = [...students];
  initializeUI();
  updateDisplay();
}

function buildStudent(row, rowIndex) {
  const rawName = row[nameColumnIndex];
  const name = rawName ? rawName.toString().trim() : '';
  if (!name) {
    return null;
  }

  const attendance = {};
  dateColumnIndexes.forEach((colIndex, idx) => {
    const label = dateColumns[idx];
    attendance[label] = normalizeAttendance(row[colIndex]);
  });

  const grades = {};
  Object.entries(gradeColumnIndexes).forEach(([key, colIndex]) => {
    grades[key] = colIndex === -1 ? '' : row[colIndex];
  });

  return {
    id: rowIndex + 1,
    originalIndex: rowIndex,
    name,
    rank: rankColumnIndex !== -1 ? row[rankColumnIndex] || '' : '',
    classLevel: classColumnIndex !== -1 ? row[classColumnIndex] || '' : '',
    phone: phoneColumnIndex !== -1 ? row[phoneColumnIndex] || '' : '',
    gender: genderColumnIndex !== -1 ? row[genderColumnIndex] || '' : '',
    age: ageColumnIndex !== -1 ? row[ageColumnIndex] || '' : '',
    rowRef: row,
    attendance,
    grades,
  };
}

function initializeUI() {
  const controlsSection = document.getElementById('controlsSection');
  const statsSection = document.getElementById('statsSection');
  const tableSection = document.getElementById('tableSection');
  const gradeSummarySection = document.getElementById('gradeSummarySection');
  const gradeEditorSection = document.getElementById('gradeEditorSection');
  const addStudentSection = document.getElementById('addStudentSection');

  if (controlsSection) controlsSection.style.display = 'block';
  if (statsSection) statsSection.style.display = 'grid';
  if (tableSection) tableSection.style.display = 'block';
  if (gradeSummarySection) gradeSummarySection.style.display = 'block';
  if (gradeEditorSection) gradeEditorSection.style.display = 'block';
   if (addStudentSection) addStudentSection.style.display = 'block';

  const dateSelect = document.getElementById('dateSelect');
  if (dateSelect) {
    dateSelect.innerHTML = '<option value="">اختر التاريخ</option>';
    dateColumns.forEach((date) => {
      const option = document.createElement('option');
      option.value = date;
      option.textContent = date;
      dateSelect.appendChild(option);
    });
  }

  populateGradeStudentSelect();
  setupEventHandlers();
  updateGradeSummary();
}

function setupEventHandlers() {
  const searchInput = document.getElementById('searchInput');
  const dateSelect = document.getElementById('dateSelect');
  const sortAlpha = document.getElementById('sortAlpha');
  const exportBtn = document.getElementById('exportExcel');
  const fileInput = document.getElementById('fileInput');
  const loadSampleBtn = document.getElementById('loadSample');
  const gradeStudentSelect = document.getElementById('gradeStudentSelect');
  const saveGradeChanges = document.getElementById('saveGradeChanges');
  const resetGradeChanges = document.getElementById('resetGradeChanges');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const attendAllBtn = document.getElementById('attendAllBtn');
  const gradeSearchInput = document.getElementById('gradeSearchInput');

  if (fileInput) fileInput.onchange = handleFileUpload;
  if (loadSampleBtn) loadSampleBtn.onclick = loadSampleData;
  if (searchInput) searchInput.oninput = handleSearch;
  if (dateSelect) dateSelect.onchange = handleDateChange;
  if (sortAlpha) sortAlpha.onclick = sortAlphabetically;
  if (exportBtn) exportBtn.onclick = exportToExcel;
  if (gradeStudentSelect) gradeStudentSelect.onchange = handleGradeStudentChange;
  if (saveGradeChanges) saveGradeChanges.onclick = handleSaveGradeChanges;
  if (resetGradeChanges) resetGradeChanges.onclick = handleResetGradeChanges;
  if (addStudentBtn) addStudentBtn.onclick = handleAddStudent;
  if (attendAllBtn) attendAllBtn.onclick = handleAttendAll;
  if (gradeSearchInput) gradeSearchInput.oninput = handleGradeSearch;
}

function updateDisplay() {
  updateTable();
  updateStats();
  updateGradeSummary();
}

function updateTable() {
  const tbody = document.getElementById('tableBody');
  const thead = document.getElementById('tableHeader');
  const dateSelect = document.getElementById('dateSelect');
  if (!tbody || !thead || !dateSelect) return;

  const selectedDate = dateSelect.value;

  thead.innerHTML = `
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            <i class="fas fa-hashtag ml-1"></i>
            م
        </th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            <i class="fas fa-user ml-1"></i>
            الاسم
        </th>
        <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            <i class="fas fa-cog ml-1"></i>
            خيارات
        </th>
        ${selectedDate ? `<th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            <i class="fas fa-calendar-check ml-1"></i>
            ${selectedDate}
        </th>` : ''}
    `;

  tbody.innerHTML = '';
  currentStudents.forEach((student) => {
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-50';

    let attendanceCell = '';
    if (selectedDate) {
      const isPresent = student.attendance[selectedDate] === 1;
      attendanceCell = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <button onclick="window.toggleAttendance(${student.id}, '${selectedDate}')"
                            class="attendance-cell px-4 py-2 rounded-lg font-bold ${isPresent ? 'present' : 'absent'}"
                            draggable="false">
                        ${isPresent ? 'حاضر ✓' : 'غائب ✗'}
                    </button>
                </td>
            `;
    }

    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${student.id}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600"
                     onclick="window.showStudentDetails(${student.id})"
                     title="عرض بيانات الطالب">
                    ${student.name}
                </div>
                <div class="text-sm text-gray-500">${student.classLevel} - ${student.rank}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="window.deleteStudent(${student.id})"
                        class="px-3 py-1 rounded-lg bg-red-500 text-white text-xs hover:bg-red-600">
                    حذف
                </button>
            </td>
            ${attendanceCell}
        `;
    tbody.appendChild(row);
  });
}

function getDateColumnIndex(label) {
  const displayIndex = dateColumns.indexOf(label);
  return displayIndex === -1 ? -1 : dateColumnIndexes[displayIndex];
}

// حساب المجموع تلقائياً من جميع الدرجات
function calculateTotal(student) {
  const attendanceGrade = Number(student.grades.attendanceGrade) || 0;
  const examGrade = Number(student.grades.exam || student.grades.hymns) || 0;
  const pretestGrade = Number(student.grades.pretest || student.grades.coptic) || 0;
  const ritesGrade = Number(student.grades.rites) || 0;
  
  const total = attendanceGrade + examGrade + pretestGrade + ritesGrade;
  return total;
}

// تحديث المجموع تلقائياً للطالب
function updateTotalForStudent(student) {
  const totalColIndex = gradeColumnIndexes.total;
  if (totalColIndex === undefined || totalColIndex === -1) return;

  const newTotal = calculateTotal(student);
  
  student.grades.total = newTotal;
  student.rowRef[totalColIndex] = newTotal;
  
  // Update workbook rows
  const studentIndex = students.indexOf(student);
  if (studentIndex !== -1 && workbookRows[studentIndex]) {
    workbookRows[studentIndex][totalColIndex] = newTotal;
  }
}

function toggleAttendance(studentId, dateLabel) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const columnIndex = getDateColumnIndex(dateLabel);
  if (columnIndex === -1) return;

  const currentValue = student.attendance[dateLabel] === 1 ? 1 : 0;
  const nextValue = currentValue === 1 ? 0 : 1;

  student.attendance[dateLabel] = nextValue;
  student.rowRef[columnIndex] = nextValue;
  
  // Update workbook rows
  const studentIndex = students.indexOf(student);
  if (studentIndex !== -1 && workbookRows[studentIndex]) {
    workbookRows[studentIndex][columnIndex] = nextValue;
  }

  // زيادة عدد مرات الحضور ودرجة الحضور تلقائياً عند الحضور
  if (nextValue === 1 && currentValue === 0) {
    // الطالب أصبح حاضراً - زيادة عدد مرات الحضور
    const attendanceCountColIndex = gradeColumnIndexes.attendanceCount;
    if (attendanceCountColIndex !== undefined && attendanceCountColIndex !== -1) {
      const currentCount = Number(student.grades.attendanceCount) || 0;
      const newCount = currentCount + 1;
      
      student.grades.attendanceCount = newCount;
      student.rowRef[attendanceCountColIndex] = newCount;
      
      // Update workbook rows
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceCountColIndex] = newCount;
      }
    }
    
    // زيادة درجة الحضور بمقدار 2.5
    const attendanceGradeColIndex = gradeColumnIndexes.attendanceGrade;
    if (attendanceGradeColIndex !== undefined && attendanceGradeColIndex !== -1) {
      const currentGrade = Number(student.grades.attendanceGrade) || 0;
      const newGrade = currentGrade + 2.5;
      
      student.grades.attendanceGrade = newGrade;
      student.rowRef[attendanceGradeColIndex] = newGrade;
      
      // Update workbook rows
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceGradeColIndex] = newGrade;
      }
      
      // تحديث المجموع تلقائياً
      updateTotalForStudent(student);
    }
  }
  // خصم عدد مرات الحضور ودرجة الحضور تلقائياً عند الغياب
  else if (nextValue === 0 && currentValue === 1) {
    // الطالب أصبح غائباً - خصم عدد مرات الحضور
    const attendanceCountColIndex = gradeColumnIndexes.attendanceCount;
    if (attendanceCountColIndex !== undefined && attendanceCountColIndex !== -1) {
      const currentCount = Number(student.grades.attendanceCount) || 0;
      const newCount = Math.max(0, currentCount - 1); // لا يقل عن 0
      
      student.grades.attendanceCount = newCount;
      student.rowRef[attendanceCountColIndex] = newCount;
      
      // Update workbook rows
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceCountColIndex] = newCount;
      }
    }
    
    // خصم درجة الحضور بمقدار 2.5
    const attendanceGradeColIndex = gradeColumnIndexes.attendanceGrade;
    if (attendanceGradeColIndex !== undefined && attendanceGradeColIndex !== -1) {
      const currentGrade = Number(student.grades.attendanceGrade) || 0;
      const newGrade = Math.max(0, currentGrade - 2.5); // لا يقل عن 0
      
      student.grades.attendanceGrade = newGrade;
      student.rowRef[attendanceGradeColIndex] = newGrade;
      
      // Update workbook rows
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceGradeColIndex] = newGrade;
      }
      
      // تحديث المجموع تلقائياً
      updateTotalForStudent(student);
    }
  }

  updateDisplay();
  autoSaveToExcel();
}

function updateStats() {
  const totalEl = document.getElementById('totalStudents');
  const presentEl = document.getElementById('presentCount');
  const absentEl = document.getElementById('absentCount');
  const dateSelect = document.getElementById('dateSelect');

  if (!totalEl || !presentEl || !absentEl || !dateSelect) return;

  const selectedDate = dateSelect.value;
  totalEl.textContent = currentStudents.length.toString();

  if (selectedDate) {
    const present = currentStudents.filter((s) => s.attendance[selectedDate] === 1).length;
    const absent = currentStudents.length - present;
    presentEl.textContent = present.toString();
    absentEl.textContent = absent.toString();
  } else {
    presentEl.textContent = '-';
    absentEl.textContent = '-';
  }
}

function deleteStudent(studentId) {
  if (!confirm('هل أنت متأكد من حذف هذا الطالب؟ لا يمكن التراجع عن هذه العملية.')) {
    return;
  }

  const index = students.findIndex((s) => s.id === studentId);
  if (index === -1) return;

  // احذف من مصفوفة الطلاب ومن صفوف الإكسل
  students.splice(index, 1);
  if (workbookRows && workbookRows.length > index) {
    workbookRows.splice(index, 1);
  }

  // إعادة ترقيم الطلاب
  students.forEach((s, idx) => {
    s.id = idx + 1;
  });

  // لو في بحث بالاسم مفعّل، نحافظ عليه
  const searchInput = document.getElementById('searchInput');
  const term = searchInput ? searchInput.value.trim().toLowerCase() : '';
  if (term) {
    currentStudents = students.filter((s) =>
      s.name.toLowerCase().includes(term)
    );
  } else {
    currentStudents = [...students];
  }

  // تحديث قائمة الطلاب في محرر الدرجات
  populateGradeStudentSelect();

  updateDisplay();
  updateGradeSummary();
  autoSaveToExcel();
}

function handleAttendAll() {
  const dateSelect = document.getElementById('dateSelect');
  if (!dateSelect || !dateSelect.value) {
    alert('برجاء اختيار تاريخ أولاً.');
    return;
  }

  const dateLabel = dateSelect.value;
  const columnIndex = getDateColumnIndex(dateLabel);
  if (columnIndex === -1) {
    alert('لا يوجد عمود حضور لهذا التاريخ في ملف الإكسل.');
    return;
  }

  students.forEach((student) => {
    const currentValue = student.attendance[dateLabel] === 1 ? 1 : 0;
    if (currentValue === 1) return; // حاضر بالفعل

    const nextValue = 1;
    student.attendance[dateLabel] = nextValue;
    student.rowRef[columnIndex] = nextValue;

    const studentIndex = students.indexOf(student);
    if (studentIndex !== -1 && workbookRows[studentIndex]) {
      workbookRows[studentIndex][columnIndex] = nextValue;
    }

    const attendanceCountColIndex = gradeColumnIndexes.attendanceCount;
    if (attendanceCountColIndex !== undefined && attendanceCountColIndex !== -1) {
      const currentCount = Number(student.grades.attendanceCount) || 0;
      const newCount = currentCount + 1;
      student.grades.attendanceCount = newCount;
      student.rowRef[attendanceCountColIndex] = newCount;
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceCountColIndex] = newCount;
      }
    }

    const attendanceGradeColIndex = gradeColumnIndexes.attendanceGrade;
    if (attendanceGradeColIndex !== undefined && attendanceGradeColIndex !== -1) {
      const currentGrade = Number(student.grades.attendanceGrade) || 0;
      const newGrade = currentGrade + 2.5;
      student.grades.attendanceGrade = newGrade;
      student.rowRef[attendanceGradeColIndex] = newGrade;
      if (studentIndex !== -1 && workbookRows[studentIndex]) {
        workbookRows[studentIndex][attendanceGradeColIndex] = newGrade;
      }
      updateTotalForStudent(student);
    }
  });

  updateDisplay();
  autoSaveToExcel();
}

function handleSearch() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    currentStudents = [...students];
  } else {
    currentStudents = students.filter((s) => s.name.toLowerCase().includes(term));
  }
  updateDisplay();
}

function handleDateChange() {
  updateDisplay();
}

function sortAlphabetically() {
  currentStudents.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  updateDisplay();
}

function exportToExcel() {
  if (!workbookHeaders.length) {
    alert('برجاء تحميل ملف أولاً.');
    return;
  }

  // Update workbook with latest data
  const wsData = [workbookHeaders, ...workbookRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'الحضور والغياب');
  
  // Use original filename if available
  const fileName = originalFileName || 'attendance_updated.xlsx';
  
  // Check if running on Android
  if (typeof Android !== 'undefined' && Android.saveFile) {
    // Android: Convert workbook to base64 and save via Android interface
    try {
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      // Store the workbook data temporarily
      window.excelFileData = wbout;
      window.excelFileName = fileName;
      
      // Trigger Android file save dialog
      Android.saveFile(fileName);
      
      // Show message
      const saveIndicator = document.getElementById('saveIndicator');
      if (saveIndicator) {
        saveIndicator.textContent = '✓ اختر مكان الحفظ...';
        saveIndicator.style.color = '#10b981';
        saveIndicator.style.display = 'block';
      }
    } catch (error) {
      console.error('Error saving file on Android:', error);
      alert('خطأ في حفظ الملف: ' + error.message);
    }
  } else {
    // Desktop/Web: Use standard file download
    try {
      XLSX.writeFile(wb, fileName);
      
      // Show success message
      const saveIndicator = document.getElementById('saveIndicator');
      if (saveIndicator) {
        saveIndicator.textContent = '✓ تم الحفظ بنجاح!';
        saveIndicator.style.color = '#10b981';
        saveIndicator.style.display = 'block';
        setTimeout(() => {
          saveIndicator.style.display = 'none';
        }, 3000);
      }
    } catch (error) {
      console.error('Error exporting file:', error);
      alert('خطأ في تصدير الملف: ' + error.message);
    }
  }
}

// -------- Grades: summary & editor --------

const GRADE_FIELDS = [
  { key: 'total', label: 'المجموع' },
  { key: 'attendanceGrade', label: 'درجة الحضور' },
  { key: 'attendanceCount', label: 'عدد مرات الحضور' },
  { key: 'hymns', label: 'درجة الالحان' },
  { key: 'coptic', label: 'درجة القبطى' },
  { key: 'rites', label: 'درجة الطقس' },
];

function populateGradeStudentSelect() {
  populateGradeStudentSelectWithList(students);
}

function populateGradeStudentSelectWithList(list) {
  const select = document.getElementById('gradeStudentSelect');
  if (!select) return;

  select.innerHTML = '<option value="">اختر الطالب</option>';
  list.forEach((student) => {
    const option = document.createElement('option');
    option.value = String(student.id);
    option.textContent = student.name;
    select.appendChild(option);
  });
}

function handleGradeSearch() {
  const input = document.getElementById('gradeSearchInput');
  if (!input) return;

  const term = input.value.trim().toLowerCase();
  if (!term) {
    populateGradeStudentSelectWithList(students);
    return;
  }

  const filtered = students.filter((s) =>
    s.name.toLowerCase().includes(term)
  );
  populateGradeStudentSelectWithList(filtered);
}

function handleGradeStudentChange() {
  const select = document.getElementById('gradeStudentSelect');
  if (!select) return;

  const studentId = Number(select.value);
  const student = students.find((s) => s.id === studentId);
  renderGradeInputs(student || null);
}

function renderGradeInputs(student) {
  const container = document.getElementById('gradeInputsContainer');
  if (!container) return;

  container.innerHTML = '';
  if (!student) return;

  GRADE_FIELDS.forEach((field) => {
    const colIndex = gradeColumnIndexes[field.key];
    if (colIndex === undefined || colIndex === -1) return; // column not present in sheet

    const value = student.grades[field.key] ?? '';

    const wrapper = document.createElement('div');
    wrapper.className = 'flex flex-col';

    const label = document.createElement('label');
    label.className = 'text-sm font-medium text-gray-700 mb-1';
    label.textContent = field.label;

    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.5';
    input.className = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500';
    input.value = value;
    input.dataset.gradeKey = field.key;

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
}

function handleSaveGradeChanges() {
  const select = document.getElementById('gradeStudentSelect');
  const container = document.getElementById('gradeInputsContainer');
  if (!select || !container) return;

  const studentId = Number(select.value);
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const inputs = container.querySelectorAll('input[data-grade-key]');
  inputs.forEach((input) => {
    const key = input.dataset.gradeKey;
    const raw = input.value;
    
    // Map exam and pretest to actual column keys
    let actualKey = key;
    if (key === 'exam' && gradeColumnIndexes.exam === -1) {
      actualKey = 'hymns';
    }
    if (key === 'pretest' && gradeColumnIndexes.pretest === -1) {
      actualKey = 'coptic';
    }
    
    const colIndex = gradeColumnIndexes[actualKey];
    if (colIndex === undefined || colIndex === -1) return;

    let numericValue = raw;
    if (raw === '') {
      numericValue = '';
    } else {
      const num = Number(raw);
      numericValue = Number.isNaN(num) ? '' : num;
    }

    student.grades[key] = numericValue;
    if (actualKey !== key) {
      student.grades[actualKey] = numericValue;
    }
    student.rowRef[colIndex] = numericValue;
    
    // Update workbook rows
    const studentIndex = students.indexOf(student);
    if (studentIndex !== -1 && workbookRows[studentIndex]) {
      workbookRows[studentIndex][colIndex] = numericValue;
    }
  });

  // تحديث المجموع تلقائياً بعد حفظ جميع التغييرات (ما عدا المجموع نفسه)
  updateTotalForStudent(student);

  updateDisplay();
  updateGradeSummary();
  autoSaveToExcel();
  alert('تم حفظ الدرجات بنجاح.');
}

function handleAddStudent() {
  if (!workbookHeaders.length) {
    alert('برجاء تحميل ملف أولاً قبل إضافة طالب.');
    return;
  }

  const nameInput = document.getElementById('newStudentName');
  const phoneInput = document.getElementById('newStudentPhone');
  const rankInput = document.getElementById('newStudentRank');
  const genderInput = document.getElementById('newStudentGender');
  const classInput = document.getElementById('newStudentClass');
  const ageInput = document.getElementById('newStudentAge');

  if (!nameInput) return;

  const name = nameInput.value.trim();
  if (!name) {
    alert('برجاء إدخال اسم الطالب.');
    return;
  }

  const phone = phoneInput ? phoneInput.value.trim() : '';
  const rank = rankInput ? rankInput.value.trim() : '';
  const gender = genderInput ? genderInput.value : '';
  const classLevel = classInput ? classInput.value.trim() : '';
  const age = ageInput ? ageInput.value.trim() : '';

  // أنشئ صفاً جديداً في بيانات Excel
  const row = Array(workbookHeaders.length).fill('');

  if (nameColumnIndex !== -1) row[nameColumnIndex] = name;
  if (phoneColumnIndex !== -1) row[phoneColumnIndex] = phone;
  if (rankColumnIndex !== -1) row[rankColumnIndex] = rank;
  if (genderColumnIndex !== -1) row[genderColumnIndex] = gender;
  if (classColumnIndex !== -1) row[classColumnIndex] = classLevel;
  if (ageColumnIndex !== -1) row[ageColumnIndex] = age;

  // الدرجات الابتدائية
  Object.entries(gradeColumnIndexes).forEach(([key, colIndex]) => {
    if (colIndex === -1) return;
    if (key === 'attendanceCount') {
      row[colIndex] = 0;
    } else if (key === 'attendanceGrade' || key === 'total') {
      row[colIndex] = 0;
    } else {
      row[colIndex] = '';
    }
  });

  // الحضور لكل التواريخ = 0 (غائب)
  dateColumnIndexes.forEach((colIndex) => {
    row[colIndex] = 0;
  });

  // أضف الصف إلى workbookRows
  workbookRows.push(row);
  const rowIndex = workbookRows.length - 1;
  const newStudent = buildStudent(row, rowIndex);
  if (!newStudent) {
    alert('حدث خطأ أثناء إضافة الطالب.');
    return;
  }

  students.push(newStudent);

  // ترتيب أبجدي وإعادة ترقيم
  students.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  students.forEach((s, idx) => {
    s.id = idx + 1;
  });

  currentStudents = [...students];

  // إعادة تحميل اختيارات الطلاب في محرر الدرجات
  populateGradeStudentSelect();

  // مسح الحقول
  nameInput.value = '';
  if (phoneInput) phoneInput.value = '';
  if (rankInput) rankInput.value = '';
  if (genderInput) genderInput.value = '';
  if (classInput) classInput.value = '';
  if (ageInput) ageInput.value = '';

  updateDisplay();
  updateGradeSummary();
  autoSaveToExcel();
  alert('تم إضافة الطالب بنجاح.');
}

function handleResetGradeChanges() {
  const select = document.getElementById('gradeStudentSelect');
  if (!select) return;

  const studentId = Number(select.value);
  const student = students.find((s) => s.id === studentId);
  renderGradeInputs(student || null);
}

function updateGradeSummary() {
  const container = document.getElementById('gradeSummaryCards');
  if (!container) return;

  container.innerHTML = '';
  if (!students.length) return;

  const summaryConfig = [
    {
      key: 'total',
      label: 'متوسط المجموع',
      icon: 'fa-star',
      type: 'average',
    },
    {
      key: 'attendanceCount',
      label: 'إجمالي مرات الحضور',
      icon: 'fa-calendar-check',
      type: 'sum',
    },
    {
      key: 'attendanceGrade',
      label: 'متوسط درجة الحضور',
      icon: 'fa-check-circle',
      type: 'average',
    },
  ];

  summaryConfig.forEach((cfg) => {
    const colIndex = gradeColumnIndexes[cfg.key];
    if (colIndex === undefined || colIndex === -1) return;

    let sum = 0;
    let count = 0;

    students.forEach((student) => {
      const raw = student.grades[cfg.key];
      const num = Number(raw);
      if (!Number.isNaN(num)) {
        sum += num;
        count += 1;
      }
    });

    let displayValue = '-';
    if (cfg.type === 'average' && count > 0) {
      displayValue = (sum / count).toFixed(1);
    } else if (cfg.type === 'sum') {
      displayValue = sum.toString();
    }

    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-4';

    card.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-gray-600 text-sm">${cfg.label}</p>
                    <p class="text-2xl font-bold text-gray-800">${displayValue}</p>
                </div>
                <i class="fas ${cfg.icon} text-3xl text-indigo-500"></i>
            </div>
        `;

    container.appendChild(card);
  });
}

function closeStudentInfo() {
  const modal = document.getElementById('studentInfoModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showStudentDetails(studentId) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return;

  const attendanceCount = student.grades.attendanceCount ?? '';
  const attendanceGrade = student.grades.attendanceGrade ?? '';
  const examGrade = student.grades.exam ?? student.grades.hymns ?? '';
  const pretestGrade = student.grades.pretest ?? student.grades.coptic ?? '';
  const ritesGrade = student.grades.rites ?? '';
  const totalGrade = student.grades.total ?? '';

  let presentDays = 0;
  let absentDays = 0;
  Object.values(student.attendance).forEach((val) => {
    if (val === 1) presentDays += 1;
    else if (val === 0 || val === '') absentDays += 1;
  });

  const modal = document.getElementById('studentInfoModal');
  const titleEl = document.getElementById('studentInfoTitle');
  const bodyEl = document.getElementById('studentInfoBody');

  const fallbackDetails = `
الاسم       : ${student.name}
رقم التليفون: ${student.phone || 'غير مسجل'}
النوع       : ${student.gender || 'غير محدد'}
السنة الدراسية: ${student.classLevel || 'غير محددة'}
الرتبة الشماسية: ${student.rank || 'غير محددة'}
السن        : ${student.age || 'غير مسجل'}

عدد مرات الحضور : ${attendanceCount || 'غير محدد'}
درجة الحضور     : ${attendanceGrade || 'غير محددة'}
درجة الامتحان   : ${examGrade || 'غير محددة'}
درجة القبلي     : ${pretestGrade || 'غير محددة'}
درجة الطقس      : ${ritesGrade || 'غير محددة'}
المجموع         : ${totalGrade || 'غير محدد'}

أيام الحضور : ${presentDays}
أيام الغياب : ${absentDays}
إجمالي الأيام: ${presentDays + absentDays}
  `;

  if (!modal || !titleEl || !bodyEl) {
    alert(fallbackDetails);
    return;
  }

  titleEl.textContent = `بيانات: ${student.name}`;
  bodyEl.innerHTML = `
    <div class="mb-3">
      <p class="font-bold text-gray-700 mb-1">البيانات الأساسية</p>
      <p>الاسم: <span class="font-semibold">${student.name}</span></p>
      <p>رقم التليفون: <span class="font-semibold">${student.phone || 'غير مسجل'}</span></p>
      <p>النوع: <span class="font-semibold">${student.gender || 'غير محدد'}</span></p>
      <p>السنة الدراسية: <span class="font-semibold">${student.classLevel || 'غير محددة'}</span></p>
      <p>الرتبة الشماسية: <span class="font-semibold">${student.rank || 'غير محددة'}</span></p>
      <p>السن: <span class="font-semibold">${student.age || 'غير مسجل'}</span></p>
    </div>
    <div class="mb-3">
      <p class="font-bold text-gray-700 mb-1">الدرجات</p>
      <p>عدد مرات الحضور: <span class="font-semibold">${attendanceCount || 'غير محدد'}</span></p>
      <p>درجة الحضور: <span class="font-semibold">${attendanceGrade || 'غير محددة'}</span></p>
      <p>درجة الامتحان: <span class="font-semibold">${examGrade || 'غير محددة'}</span></p>
      <p>درجة القبلي: <span class="font-semibold">${pretestGrade || 'غير محددة'}</span></p>
      <p>درجة الطقس: <span class="font-semibold">${ritesGrade || 'غير محددة'}</span></p>
      <p>المجموع: <span class="font-semibold">${totalGrade || 'غير محدد'}</span></p>
    </div>
    <div>
      <p class="font-bold text-gray-700 mb-1">الحضور</p>
      <p>أيام الحضور: <span class="font-semibold">${presentDays}</span></p>
      <p>أيام الغياب: <span class="font-semibold">${absentDays}</span></p>
      <p>إجمالي الأيام: <span class="font-semibold">${presentDays + absentDays}</span></p>
    </div>
  `;

  modal.style.display = 'flex';
}

// -------- Sample data --------

function loadSampleData() {
  const headers = [
    'المجموع',
    'درجة الطقس',
    'درجة القبطى',
    'درجة الالحان',
    'درجة الحضور',
    'عدد مرات الحضور',
    '5/12/25',
    '28/11/25',
    '21/11/25',
    '14/11/25',
    '7/11/25',
    '31/10/25',
    '24/10/25',
    '17/10/25',
    'رقم التليفون',
    'الرتبة الشماسية',
    'النوع',
    'السنة الدراسية',
    'السن',
    'الاسم الثلاثى',
  ];

  const sampleNames = [
    'ابرام القس مينا',
    'ادم اسحق ونس',
    'استيفانا يوحنا عوض',
    'انطون مينا سمير',
    'إيلى جوزيف جورج',
    'بولس جرجس حنا',
    'بولس ميخائيل إبراهيم',
    'بولس يوسف متى',
    'بيمن مرقس بولس',
    'جرجس كيرلس رمسيس',
    'مرقس أنطونيو مجدي',
    'مينا ميلاد فوزي',
  ];

  const rows = sampleNames.map((name, index) => {
    const row = Array(headers.length).fill('');
    row[19] = name;
    row[18] = (9 + (index % 4)).toString();
    row[17] = index % 2 === 0 ? 'رابعة' : 'ثالثة';
    row[16] = index % 3 === 0 ? 'ذكر' : 'أنثى';
    row[15] = ['شماس', 'أغنسطس', 'ابأسقف'][index % 3];
    row[14] =
      '012' + Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    row[5] = Math.floor(Math.random() * 4);
    row[4] = (5 + Math.random() * 5).toFixed(1);
    row[3] = (5 + Math.random() * 5).toFixed(1);
    row[2] = (5 + Math.random() * 5).toFixed(1);
    row[1] = (5 + Math.random() * 5).toFixed(1);
    row[0] = (
      Number(row[1]) +
      Number(row[2]) +
      Number(row[3]) +
      Number(row[4])
    ).toFixed(1);
    for (let col = 6; col <= 13; col++) {
      row[col] = Math.random() > 0.3 ? 1 : 0;
    }
    return row;
  });

  const dataset = [headers, ...rows];
  processExcelData(dataset);

  const fileNameSpan = document.getElementById('fileName');
  if (fileNameSpan) fileNameSpan.textContent = 'بيانات تجريبية';
}

// -------- Initialization --------

document.addEventListener('DOMContentLoaded', () => {
  // If file input already has change handler from setupEventHandlers it will be overridden there
  const fileInput = document.getElementById('fileInput');
  if (fileInput && !fileInput.onchange) {
    fileInput.onchange = handleFileUpload;
  }

  // If there is a "load sample" button and no handler yet, attach it
  const loadSampleBtn = document.getElementById('loadSample');
  if (loadSampleBtn && !loadSampleBtn.onclick) {
    loadSampleBtn.onclick = loadSampleData;
  }

  // Hook modal close button if present
  const closeStudentInfoBtn = document.getElementById('closeStudentInfoBtn');
  if (closeStudentInfoBtn) {
    closeStudentInfoBtn.onclick = closeStudentInfo;
  }
  
  // Make functions globally available
  window.toggleAttendance = toggleAttendance;
  window.showStudentDetails = showStudentDetails;
   window.deleteStudent = deleteStudent;
   window.closeStudentInfo = closeStudentInfo;
});


