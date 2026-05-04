import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ValidateResetOtpDto {
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'OTP is required' })
  @Matches(/^\d{6}$/, { message: 'OTP must be a 6-digit code' })
  otp: string;
}
