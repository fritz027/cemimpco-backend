import { QueryStatement } from "../../database/query";
import { sendOTPMessage } from "./semaphore";
import dayjs from "dayjs";

export async function processOtp(memberNo: string, number: string): Promise<{ success: boolean; data?: any; message?: string }> {
  try {
    const member = await QueryStatement<{ member_no: string }>(
      'SELECT 1 FROM member WHERE member_no = ? AND telno = ?',
      [memberNo, number]
    )

    if (member.length === 0) {
      return { success: false, message: 'Error Mobile no did not match' }
    }

    const sendOtp = await sendOTPMessage(number)

    if (!sendOtp.data?.[0]?.code) {
      return { success: false, message: 'Failed Sending OTP please try again later' }
    }

    const existingLog = await QueryStatement(
      'SELECT 1 FROM otp_logs WHERE member_no = ? AND mobile_no = ?',
      [memberNo, number]
    )

    if (existingLog.length > 0) {
      await QueryStatement(
        'DELETE FROM otp_logs WHERE member_no = ? AND mobile_no = ?',
        [memberNo, number]
      )
    }

    const dateCreated = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const dateExpired = dayjs().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss')

    const result: any = await QueryStatement(
      'INSERT INTO otp_logs (member_no, mobile_no, otp, created_date, expiration_date) VALUES (?,?,?,?,?)',
      [memberNo, number, sendOtp.data[0].code, dateCreated, dateExpired]
    )

    if ((result?.count ?? result?.rowsAffected ?? 0) > 0) {
      return { success: true, data: sendOtp }
    }

    return { success: false, message: 'Failed Sending OTP please try again later' }

  } catch (error) {
    logging.error(`Error on function processOtp: ${error}`)
    throw error
  }
}


export async function verifyOtp(memberNo: string, mobileNo: string, otp: string): Promise<{ success: boolean; message: string }> {
  try {
    const rows = await QueryStatement(
      'SELECT 1 FROM otp_logs WHERE member_no = ? AND mobile_no = ? AND otp = ?',
      [memberNo, mobileNo, otp]
    )

    if (rows.length === 0) {
      return { success: false, message: 'Invalid/Incorrect OTP' }
    }

    const result: any = await QueryStatement(
      'DELETE FROM otp_logs WHERE member_no = ? AND mobile_no = ? AND otp = ?',
      [memberNo, mobileNo, otp]
    )

    if ((result?.count ?? result?.rowsAffected ?? 0) > 0) {
      return { success: true, message: `${otp} is successfully verified!` }
    }

    return { success: false, message: 'OTP number is invalid' }

  } catch (error) {
    logging.error(`Error on function verifyOtp: ${error}`)
    throw error
  }
}


export async function checkExpiredOtp(memberNo: string, number: string): Promise<{ success: boolean; data?: number; message?: string }> {
  try {
    const rows = await QueryStatement<{ expiration_date: string }>(
      'SELECT * FROM otp_logs WHERE member_no = ? AND mobile_no = ?',
      [memberNo, number]
    )

    if (rows.length === 0) {
      return { success: false, message: 'No otp log found!' }
    }

    const seconds = dayjs(rows[0].expiration_date).diff(dayjs(), 'second')

    if (seconds > 0) {
      return { success: true, data: seconds }
    }

    return { success: false, message: 'Otp Expired!' }

  } catch (error) {
    logging.error(`Error on Function checkExpiredOtp: ${error}`)
    throw error
  }
}
