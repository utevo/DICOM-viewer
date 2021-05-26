import { __, match } from "ts-pattern";

import { Err, Ok, Result } from "../../common/result";

export enum TransferSyntax {
  JPEG2000 = "JPEG2000",
  DecodeRLE = "DecodeRLE",
  JPEGLossless = "JPEGLossless",
  JPEGBaseline = "JPEGBaseline",
  UncompressedLE = "UncompressedLE",
  UncompressedBE = "UncompressedBE",
}

export const TransferSyntax_ = {
  default: (): TransferSyntax => TransferSyntax.UncompressedLE,

  fromTransferSyntaxUID: (transferSyntax: string): Result<TransferSyntax, string> =>
    match(transferSyntax)
      .with("1.2.840.10008.1.2", "1.2.840.10008.1.2.1", () => Ok(TransferSyntax.UncompressedLE))
      .with("1.2.840.10008.1.2.2", () => Ok(TransferSyntax.UncompressedBE))
      .with("1.2.840.10008.1.2.4.90", "1.2.840.10008.1.2.4.91", () => Ok(TransferSyntax.JPEG2000))
      .with("1.2.840.10008.1.2.5", () => Ok(TransferSyntax.DecodeRLE))
      .with("1.2.840.10008.1.2.4.57", "1.2.840.10008.1.2.4.70", () => Ok(TransferSyntax.JPEGLossless))
      .with("1.2.840.10008.1.2.4.50", "1.2.840.10008.1.2.4.51", () => Ok(TransferSyntax.JPEGBaseline))
      .with(__, () => Err("Unexpected transfer syntax"))
      .exhaustive(),

  toCompressionAndEndianness: (transferSyntax: TransferSyntax): [Compression, Endianness] =>
    match<TransferSyntax, [Compression, Endianness]>(transferSyntax)
      .with(TransferSyntax.UncompressedBE, () => [Compression.None, Endianness.BigEndian])
      .with(TransferSyntax.UncompressedLE, () => [Compression.None, Endianness.LittleEndian])
      .with(TransferSyntax.DecodeRLE, () => [Compression.Rle, Endianness.LittleEndian])
      .with(TransferSyntax.JPEGLossless, () => [Compression.JpegLossless, Endianness.LittleEndian])
      .with(TransferSyntax.JPEG2000, () => [Compression.Jpeg2000, Endianness.LittleEndian])
      .with(TransferSyntax.JPEGBaseline, () => [Compression.JpegBaseline, Endianness.LittleEndian])
      .exhaustive(),
};

export enum Endianness {
  LittleEndian = "LITTLE_ENDIAN",
  BigEndian = "BIG_ENDIAN",
}

export enum Compression {
  None = "NONE",
  JpegLossless = "JPEG_LOSSLESS",
  JpegBaseline = "JPEG_BASELINE",
  Jpeg2000 = "JPEG_2000",
  Rle = "RLE",
}

export enum PhotometricInterpratation { // DON'T CHANGE VALUES!
  Monochrome1 = "MONOCHROME1",
  Monochrome2 = "MONOCHROME2",
  PaletteColor = "PALETTE COLOR",
  Rgb = "Rgb",
  Hsv = "HSV",
  Argb = "ARGB",
  Cmyk = "CMYK",
  YbrFull = "YBR_FULL",
  YbrFull422 = "YBR_FULL_422",
  YbrPartial422 = "YBR_PARTIAL_422",
  YbrPartial420 = "YBR_PARTIAL_420",
  YbrIct = "YBR_ICT",
  YbrRct = "YBR_RCT",
}

export enum PixelRepresentation {
  Unsigned = "UNSIGNED",
  Signed = "SIGNED",
}

export enum PlanarConfiguration {
  Interlaced = 0,
  Separated = 1,
}

export enum VoiLutFunction {
  Linear = "LINEAR",
  LinearExact = "LINEAR_EXACT",
  Sigmoid = "SIGMOID",
}
export const VoiLutFunction_ = {
  default: (): VoiLutFunction => VoiLutFunction.Linear,
};

export type VoiLutModule = Readonly<{
  window: VoiLutWindow;
  voiLutFunction: VoiLutFunction;
}>;

export type VoiLutWindow = Readonly<{
  center: number;
  width: number;
}>;
export const VoiLutWindow = {
  default: (): VoiLutWindow => ({
    center: 1024,
    width: 4096,
  }),
};

export type PixelSpacing = Readonly<{
  row: number;
  column: number;
}>;
export const PixelSpacing = {
  fromString: (str: string): Result<PixelSpacing, string> => {
    const rawNumbers = str.split("\\");
    if (rawNumbers.length != 2) {
      return Err("Invalid value of Pixel Spacing");
    }

    try {
      return Ok({
        row: Number.parseFloat(rawNumbers[0]),
        column: Number.parseFloat(rawNumbers[1]),
      });
    } catch (e) {
      return Err("Invalid value of Pixel Spacing");
    }
  },
};
