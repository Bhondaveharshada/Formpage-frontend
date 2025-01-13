import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule,ActivatedRoute } from '@angular/router';
import { ObjectKeysPipe } from '../pipes/object-keys.pipe';
import { FormService } from '../services/form.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
declare var bootstrap: any;
const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
const EXCEL_EXTENSION = '.xlsx';

@Component({
  selector: 'app-userforms',
  imports: [RouterModule, CommonModule, ObjectKeysPipe,],
  templateUrl: './userforms.component.html',
  styleUrl: './userforms.component.css',
  providers:[ObjectKeysPipe]
})
export class UserformsComponent implements OnInit {

  formTitle:any
  mappedFields: any[] = []; 
  selectedFormDetails: any = {};
  
  constructor(private formservice:FormService, private route:ActivatedRoute, private objectkeys: ObjectKeysPipe){}


  
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    console.log(id);
    this.formservice.fetchUserForms(id).subscribe({
      next: (res: any) => {
        const targetId = res.result;
        const fields = res.Fields; // Form details
        this.formTitle = fields.title; // Extract form title
        console.log('Form Title:', this.formTitle);
    
        const mappedFields: any[] = []; // Array to hold the mapped data
    
        // Loop through all form entries in the result
        for (let item of res.result) {
          const keyValuePairs: Record<string, any> = {}; // Object to hold key-value pairs for this form
    
          // Map additionalFields values
          fields.additionalFields.forEach((field: any) => {
            const matchingField = item.additionalFields.find(
              (af: any) => af.label === field.label
            ); // Find matching field by label
            
            const key = field.label; // Use label as key
            const value = matchingField?.value || 'N/A'; // Use value if found, otherwise fallback to 'N/A'
            keyValuePairs[key] = value; // Map the key to its value
          });
    
          // Add this form's data to the array
          mappedFields.push({
            formId: item._id,
            keyValuePairs: keyValuePairs,
          });
        }
    
        this.mappedFields = mappedFields; // Store the mapped data in a variable for display
        console.log('Mapped Fields:', this.mappedFields);
      },
      error: (err) => {
        console.log(err);
      },
    });
          
  }

       
  openmodel(index:any){
    this.selectedFormDetails = this.mappedFields[index];
    const modalElement = document.getElementById('viewDetailsModal');
    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  exportToExcel(): void {
    const dataToExport = this.mappedFields.map((form, index) => {
      const row = { 'Sr. No.': index + 1, ...form.keyValuePairs };
      for (const key in form.keyValuePairs) {
        if (Array.isArray(form.keyValuePairs[key])) {
          // Join array elements into a comma-separated string
          row[key] = form.keyValuePairs[key].join(', ');
        } else {
          // Directly add other fields
          row[key] = form.keyValuePairs[key];
        }
      }
      return row;
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport); // Convert to worksheet
    const workbook: XLSX.WorkBook = { Sheets: { 'User Data': worksheet }, SheetNames: ['User Data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    this.saveAsExcelFile(excelBuffer, this.formTitle); // Save file
  }

  private saveAsExcelFile(buffer: any, fileName: string): void {
    const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
    FileSaver.saveAs(data, `${fileName}_export_${new Date().getTime()}${EXCEL_EXTENSION}`);
  }

  
}




