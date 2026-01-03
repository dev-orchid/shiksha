export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string
          name: string
          code: string
          address: string | null
          city: string | null
          state: string | null
          country: string | null
          pincode: string | null
          phone: string | null
          email: string | null
          website: string | null
          logo_url: string | null
          principal_name: string | null
          established_year: number | null
          board_affiliation: string | null
          is_active: boolean
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          principal_name?: string | null
          established_year?: number | null
          board_affiliation?: string | null
          is_active?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          address?: string | null
          city?: string | null
          state?: string | null
          country?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          website?: string | null
          logo_url?: string | null
          principal_name?: string | null
          established_year?: number | null
          board_affiliation?: string | null
          is_active?: boolean
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      academic_years: {
        Row: {
          id: string
          school_id: string | null
          name: string
          start_date: string
          end_date: string
          is_current: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          name: string
          start_date: string
          end_date: string
          is_current?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          name?: string
          start_date?: string
          end_date?: string
          is_current?: boolean
          created_at?: string
        }
      }
      classes: {
        Row: {
          id: string
          school_id: string | null
          name: string
          grade_level: number
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          name: string
          grade_level: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          name?: string
          grade_level?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          school_id: string | null
          class_id: string | null
          name: string
          capacity: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          class_id?: string | null
          name: string
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          class_id?: string | null
          name?: string
          capacity?: number
          is_active?: boolean
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          school_id: string | null
          name: string
          code: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          name: string
          code: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          name?: string
          code?: string
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      departments: {
        Row: {
          id: string
          school_id: string | null
          name: string
          code: string | null
          head_id: string | null
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          name: string
          code?: string | null
          head_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          name?: string
          code?: string | null
          head_id?: string | null
          description?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          school_id: string | null
          email: string
          password_hash: string | null
          role: UserRole
          is_active: boolean
          email_verified: boolean
          phone: string | null
          phone_verified: boolean
          avatar_url: string | null
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          email: string
          password_hash?: string | null
          role: UserRole
          is_active?: boolean
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          avatar_url?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          email?: string
          password_hash?: string | null
          role?: UserRole
          is_active?: boolean
          email_verified?: boolean
          phone?: string | null
          phone_verified?: boolean
          avatar_url?: string | null
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          school_id: string | null
          user_id: string | null
          admission_number: string
          roll_number: string | null
          first_name: string
          last_name: string | null
          date_of_birth: string
          gender: Gender | null
          blood_group: string | null
          nationality: string | null
          religion: string | null
          caste: string | null
          category: string | null
          aadhaar_number: string | null
          current_class_id: string | null
          current_section_id: string | null
          academic_year_id: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          phone: string | null
          email: string | null
          emergency_contact: string | null
          medical_conditions: string | null
          allergies: string | null
          admission_date: string
          admission_class_id: string | null
          previous_school: string | null
          transfer_certificate_number: string | null
          status: StudentStatus
          leaving_date: string | null
          leaving_reason: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          admission_number: string
          roll_number?: string | null
          first_name: string
          last_name?: string | null
          date_of_birth: string
          gender?: Gender | null
          blood_group?: string | null
          nationality?: string | null
          religion?: string | null
          caste?: string | null
          category?: string | null
          aadhaar_number?: string | null
          current_class_id?: string | null
          current_section_id?: string | null
          academic_year_id?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          emergency_contact?: string | null
          medical_conditions?: string | null
          allergies?: string | null
          admission_date: string
          admission_class_id?: string | null
          previous_school?: string | null
          transfer_certificate_number?: string | null
          status?: StudentStatus
          leaving_date?: string | null
          leaving_reason?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          admission_number?: string
          roll_number?: string | null
          first_name?: string
          last_name?: string | null
          date_of_birth?: string
          gender?: Gender | null
          blood_group?: string | null
          nationality?: string | null
          religion?: string | null
          caste?: string | null
          category?: string | null
          aadhaar_number?: string | null
          current_class_id?: string | null
          current_section_id?: string | null
          academic_year_id?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          phone?: string | null
          email?: string | null
          emergency_contact?: string | null
          medical_conditions?: string | null
          allergies?: string | null
          admission_date?: string
          admission_class_id?: string | null
          previous_school?: string | null
          transfer_certificate_number?: string | null
          status?: StudentStatus
          leaving_date?: string | null
          leaving_reason?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      parents: {
        Row: {
          id: string
          school_id: string | null
          user_id: string | null
          first_name: string
          last_name: string | null
          relation: ParentRelation
          phone: string
          email: string | null
          occupation: string | null
          workplace: string | null
          annual_income: number | null
          address: string | null
          aadhaar_number: string | null
          photo_url: string | null
          is_primary_contact: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          first_name: string
          last_name?: string | null
          relation: ParentRelation
          phone: string
          email?: string | null
          occupation?: string | null
          workplace?: string | null
          annual_income?: number | null
          address?: string | null
          aadhaar_number?: string | null
          photo_url?: string | null
          is_primary_contact?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          first_name?: string
          last_name?: string | null
          relation?: ParentRelation
          phone?: string
          email?: string | null
          occupation?: string | null
          workplace?: string | null
          annual_income?: number | null
          address?: string | null
          aadhaar_number?: string | null
          photo_url?: string | null
          is_primary_contact?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      staff: {
        Row: {
          id: string
          school_id: string | null
          user_id: string | null
          employee_id: string
          first_name: string
          last_name: string | null
          date_of_birth: string | null
          gender: Gender | null
          blood_group: string | null
          nationality: string | null
          aadhaar_number: string | null
          pan_number: string | null
          department_id: string | null
          designation: string
          employee_type: EmployeeType
          employment_type: EmploymentType
          joining_date: string
          experience_years: number
          highest_qualification: string | null
          specialization: string | null
          certifications: string[] | null
          phone: string
          email: string | null
          address: string | null
          city: string | null
          state: string | null
          pincode: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          bank_name: string | null
          bank_account_number: string | null
          ifsc_code: string | null
          status: StaffStatus
          leaving_date: string | null
          leaving_reason: string | null
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          employee_id: string
          first_name: string
          last_name?: string | null
          date_of_birth?: string | null
          gender?: Gender | null
          blood_group?: string | null
          nationality?: string | null
          aadhaar_number?: string | null
          pan_number?: string | null
          department_id?: string | null
          designation: string
          employee_type: EmployeeType
          employment_type?: EmploymentType
          joining_date: string
          experience_years?: number
          highest_qualification?: string | null
          specialization?: string | null
          certifications?: string[] | null
          phone: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          ifsc_code?: string | null
          status?: StaffStatus
          leaving_date?: string | null
          leaving_reason?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          user_id?: string | null
          employee_id?: string
          first_name?: string
          last_name?: string | null
          date_of_birth?: string | null
          gender?: Gender | null
          blood_group?: string | null
          nationality?: string | null
          aadhaar_number?: string | null
          pan_number?: string | null
          department_id?: string | null
          designation?: string
          employee_type?: EmployeeType
          employment_type?: EmploymentType
          joining_date?: string
          experience_years?: number
          highest_qualification?: string | null
          specialization?: string | null
          certifications?: string[] | null
          phone?: string
          email?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          pincode?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          bank_name?: string | null
          bank_account_number?: string | null
          ifsc_code?: string | null
          status?: StaffStatus
          leaving_date?: string | null
          leaving_reason?: string | null
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      student_attendance: {
        Row: {
          id: string
          school_id: string | null
          student_id: string | null
          class_id: string | null
          section_id: string | null
          date: string
          status: AttendanceStatus
          check_in_time: string | null
          check_out_time: string | null
          remarks: string | null
          marked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          student_id?: string | null
          class_id?: string | null
          section_id?: string | null
          date: string
          status: AttendanceStatus
          check_in_time?: string | null
          check_out_time?: string | null
          remarks?: string | null
          marked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          student_id?: string | null
          class_id?: string | null
          section_id?: string | null
          date?: string
          status?: AttendanceStatus
          check_in_time?: string | null
          check_out_time?: string | null
          remarks?: string | null
          marked_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      staff_attendance: {
        Row: {
          id: string
          school_id: string | null
          staff_id: string | null
          date: string
          status: StaffAttendanceStatus
          check_in_time: string | null
          check_out_time: string | null
          overtime_hours: number
          remarks: string | null
          marked_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          staff_id?: string | null
          date: string
          status: StaffAttendanceStatus
          check_in_time?: string | null
          check_out_time?: string | null
          overtime_hours?: number
          remarks?: string | null
          marked_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          staff_id?: string | null
          date?: string
          status?: StaffAttendanceStatus
          check_in_time?: string | null
          check_out_time?: string | null
          overtime_hours?: number
          remarks?: string | null
          marked_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fee_invoices: {
        Row: {
          id: string
          school_id: string | null
          student_id: string | null
          invoice_number: string
          academic_year_id: string | null
          month: number | null
          year: number | null
          total_amount: number
          discount_amount: number
          late_fee: number
          net_amount: number
          paid_amount: number
          balance_amount: number
          due_date: string
          status: FeeStatus
          generated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          student_id?: string | null
          invoice_number: string
          academic_year_id?: string | null
          month?: number | null
          year?: number | null
          total_amount: number
          discount_amount?: number
          late_fee?: number
          net_amount: number
          paid_amount?: number
          balance_amount: number
          due_date: string
          status?: FeeStatus
          generated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          student_id?: string | null
          invoice_number?: string
          academic_year_id?: string | null
          month?: number | null
          year?: number | null
          total_amount?: number
          discount_amount?: number
          late_fee?: number
          net_amount?: number
          paid_amount?: number
          balance_amount?: number
          due_date?: string
          status?: FeeStatus
          generated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      fee_payments: {
        Row: {
          id: string
          school_id: string | null
          invoice_id: string | null
          receipt_number: string
          amount: number
          payment_date: string
          payment_mode: PaymentMode
          transaction_id: string | null
          cheque_number: string | null
          cheque_date: string | null
          bank_name: string | null
          remarks: string | null
          received_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          invoice_id?: string | null
          receipt_number: string
          amount: number
          payment_date: string
          payment_mode: PaymentMode
          transaction_id?: string | null
          cheque_number?: string | null
          cheque_date?: string | null
          bank_name?: string | null
          remarks?: string | null
          received_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          invoice_id?: string | null
          receipt_number?: string
          amount?: number
          payment_date?: string
          payment_mode?: PaymentMode
          transaction_id?: string | null
          cheque_number?: string | null
          cheque_date?: string | null
          bank_name?: string | null
          remarks?: string | null
          received_by?: string | null
          created_at?: string
        }
      }
      exams: {
        Row: {
          id: string
          school_id: string | null
          academic_year_id: string | null
          exam_type_id: string | null
          name: string
          start_date: string
          end_date: string
          status: ExamStatus
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          academic_year_id?: string | null
          exam_type_id?: string | null
          name: string
          start_date: string
          end_date: string
          status?: ExamStatus
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          academic_year_id?: string | null
          exam_type_id?: string | null
          name?: string
          start_date?: string
          end_date?: string
          status?: ExamStatus
          created_at?: string
          updated_at?: string
        }
      }
      exam_results: {
        Row: {
          id: string
          exam_schedule_id: string | null
          student_id: string | null
          marks_obtained: number | null
          grade: string | null
          remarks: string | null
          is_absent: boolean
          entered_by: string | null
          verified_by: string | null
          verified_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_schedule_id?: string | null
          student_id?: string | null
          marks_obtained?: number | null
          grade?: string | null
          remarks?: string | null
          is_absent?: boolean
          entered_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_schedule_id?: string | null
          student_id?: string | null
          marks_obtained?: number | null
          grade?: string | null
          remarks?: string | null
          is_absent?: boolean
          entered_by?: string | null
          verified_by?: string | null
          verified_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      salary_payroll: {
        Row: {
          id: string
          school_id: string | null
          staff_id: string | null
          month: number
          year: number
          working_days: number | null
          present_days: number | null
          leave_days: number | null
          gross_salary: number
          total_deductions: number
          net_salary: number
          status: PayrollStatus
          processed_by: string | null
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          staff_id?: string | null
          month: number
          year: number
          working_days?: number | null
          present_days?: number | null
          leave_days?: number | null
          gross_salary: number
          total_deductions?: number
          net_salary: number
          status?: PayrollStatus
          processed_by?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          staff_id?: string | null
          month?: number
          year?: number
          working_days?: number | null
          present_days?: number | null
          leave_days?: number | null
          gross_salary?: number
          total_deductions?: number
          net_salary?: number
          status?: PayrollStatus
          processed_by?: string | null
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_messages: {
        Row: {
          id: string
          school_id: string | null
          template_id: string | null
          message_type: MessageType
          recipient_phone: string | null
          group_id: string | null
          content: string
          status: MessageStatus
          error_message: string | null
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          sent_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          school_id?: string | null
          template_id?: string | null
          message_type: MessageType
          recipient_phone?: string | null
          group_id?: string | null
          content: string
          status?: MessageStatus
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          sent_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          school_id?: string | null
          template_id?: string | null
          message_type?: MessageType
          recipient_phone?: string | null
          group_id?: string | null
          content?: string
          status?: MessageStatus
          error_message?: string | null
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          sent_by?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          notification_type: NotificationType
          reference_type: string | null
          reference_id: string | null
          is_read: boolean
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          notification_type: NotificationType
          reference_type?: string | null
          reference_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          notification_type?: NotificationType
          reference_type?: string | null
          reference_id?: string | null
          is_read?: boolean
          read_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

// Enum Types
export type UserRole = 'super_admin' | 'admin' | 'principal' | 'teacher' | 'accountant' | 'student' | 'parent'
export type Gender = 'male' | 'female' | 'other'
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'transferred'
export type StaffStatus = 'active' | 'on_leave' | 'resigned' | 'terminated'
export type ParentRelation = 'father' | 'mother' | 'guardian'
export type EmployeeType = 'teaching' | 'non-teaching' | 'admin'
export type EmploymentType = 'permanent' | 'contract' | 'temporary'
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave'
export type StaffAttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'leave' | 'work_from_home'
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'
export type FeeStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMode = 'cash' | 'cheque' | 'upi' | 'card' | 'bank_transfer' | 'online'
export type ExamStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
export type PayrollStatus = 'pending' | 'processed' | 'paid' | 'cancelled'
export type MessageType = 'individual' | 'group' | 'broadcast'
export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'
export type NotificationType = 'fee_due' | 'attendance' | 'result' | 'announcement' | 'leave' | 'general'

// Convenience types
export type School = Database['public']['Tables']['schools']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Parent = Database['public']['Tables']['parents']['Row']
export type Staff = Database['public']['Tables']['staff']['Row']
export type Class = Database['public']['Tables']['classes']['Row']
export type Section = Database['public']['Tables']['sections']['Row']
export type Subject = Database['public']['Tables']['subjects']['Row']
export type AcademicYear = Database['public']['Tables']['academic_years']['Row']
export type StudentAttendance = Database['public']['Tables']['student_attendance']['Row']
export type StaffAttendance = Database['public']['Tables']['staff_attendance']['Row']
export type FeeInvoice = Database['public']['Tables']['fee_invoices']['Row']
export type FeePayment = Database['public']['Tables']['fee_payments']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type ExamResult = Database['public']['Tables']['exam_results']['Row']
export type SalaryPayroll = Database['public']['Tables']['salary_payroll']['Row']
export type WhatsAppMessage = Database['public']['Tables']['whatsapp_messages']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
