import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Đọc environment variables từ .env file
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://glppizdubinvwuncteah.supabase.co'
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdscHBpemR1Ymludnd1bmN0ZWFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NTM2MjYsImV4cCI6MjA2ODQyOTYyNn0.DEvmpyv3ABM1NQH7ag_0s_uNxdM7X1rwP9FnB4AzEMU'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Thiếu environment variables VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateDinhMuc() {
  try {
    console.log('🚀 Bắt đầu cập nhật định mức...')
    
    // Đọc file định mức v2
    const filePath = path.join(__dirname, '../file/dinh muc v2.json')
    const dinhMucData = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    
    console.log(`📋 Đọc được ${dinhMucData.length} records từ file`)
    
    // Kiểm tra xem bảng ksk_benchmark đã tồn tại chưa
    const { data: existingData, error: selectError } = await supabase
      .from('ksk_benchmark')
      .select('id')
      .limit(1)
    
    if (selectError && selectError.message.includes('relation "ksk_benchmark" does not exist')) {
      console.log('⚠️  Bảng ksk_benchmark chưa tồn tại. Cần tạo bảng trước.')
      return
    }
    
    // Xóa dữ liệu cũ
    console.log('🗑️  Xóa dữ liệu cũ...')
    const { error: deleteError } = await supabase
      .from('ksk_benchmark')
      .delete()
      .neq('id', '0') // Xóa tất cả
    
    if (deleteError) {
      console.error('❌ Lỗi khi xóa dữ liệu cũ:', deleteError)
      return
    }
    
    // Thêm dữ liệu mới
    console.log('➕ Thêm dữ liệu mới...')
    const { data, error: insertError } = await supabase
      .from('ksk_benchmark')
      .insert(dinhMucData)
    
    if (insertError) {
      console.error('❌ Lỗi khi thêm dữ liệu:', insertError)
      return
    }
    
    console.log('✅ Cập nhật định mức thành công!')
    console.log(`📊 Đã thêm ${dinhMucData.length} records`)
    
    // Verify
    const { count } = await supabase
      .from('ksk_benchmark')
      .select('*', { count: 'exact', head: true })
    
    console.log(`🔍 Verify: Hiện có ${count} records trong bảng`)
    
  } catch (error) {
    console.error('❌ Lỗi:', error)
  }
}

updateDinhMuc()