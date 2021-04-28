import { DataSet, parseDicom } from "dicom-parser";
import { Result, ResultTag } from "../../types";

export interface DicomImage {
  compression: Compression;
  endianness: Endianness;

  rows: number;
  columns: number;

  samplePerPixel: number;
  photometricInterpratation: PhotometricInterpratation;

  planarConfiguration?: PlanarConfiguration;

  bitsAllocated: number;
  bitsStored: number;
  highBit: number;

  pixelRepresentation: PixelRepresentation;

  pixelData: Uint8Array;
  pixelDataVr: "OB" | "OW";

  voiLutModule: {
    windowCenter?: number;
    windowWidth?: number;
    voiLutFunction?: string;
  };
}

export const DicomImage = {
  fromFile: async (file: File): Promise<Result<DicomImage, string>> => {
    const arrayBuffer = await file.arrayBuffer();
    const byteArray = new Uint8Array(arrayBuffer);
    const dataSet = parseDicom(byteArray);

    return DicomImage._fromDataSet(dataSet);
  },
  _fromDataSet: (dataSet: DataSet): Result<DicomImage, string> => {
    const transferSyntax = TransferSyntax_.fromTransferSyntaxUID(dataSet.string("x00020012"));

    const [compression, endianness] = TransferSyntax_.toCompressionAndEndianness(transferSyntax);

    const rows = dataSet.uint16("x00280010");
    if (rows == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have rows",
      };

    const columns = dataSet.uint16("x00280011");
    if (columns == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have columns",
      };

    const samplePerPixel = dataSet.uint16("x00280002");
    if (samplePerPixel == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have samplePerPixel",
      };

    const photometricInterpratationValue = dataSet.string("x00280004");
    if (photometricInterpratationValue == null) {
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have photometricInterpratation",
      };
    }

    const photometricInterpratation = photometricInterpratationValue as PhotometricInterpratation; // ToDo: Need validation

    const planarConfigurationValue = dataSet.uint16("x00280006") ?? 0;
    let planarConfiguration: PlanarConfiguration;
    switch (planarConfigurationValue) {
      case 0:
        planarConfiguration = PlanarConfiguration.Interlaced;
        break;

      case 1:
        planarConfiguration = PlanarConfiguration.Separated;
        break;

      default:
        return {
          _tag: ResultTag.Err,
          value: "DicomImage have incorrect planarConfiguration",
        };
    }

    const bitsAllocated = dataSet.uint16("x00280100");
    if (bitsAllocated == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have bitsAllocated",
      };

    const bitsStored = dataSet.uint16("x00280101");
    if (bitsStored == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have bitsStored",
      };

    const highBit = dataSet.uint16("x00280102");
    if (highBit == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have highBit",
      };

    const pixelRepresentationValue = dataSet.uint16("x00280103");
    if (pixelRepresentationValue == null)
      return {
        _tag: ResultTag.Err,
        value: "DicomImage need to have pixelRepresentationValue",
      };

    let pixelRepresentation: PixelRepresentation;
    switch (pixelRepresentationValue) {
      case 0:
        pixelRepresentation = PixelRepresentation.Unsigned;
        break;
      case 1:
        pixelRepresentation = PixelRepresentation.Signed;
        break;
      default:
        return {
          _tag: ResultTag.Err,
          value: "Unexpected value of pixelRepresentation",
        };
    }

    const pixelDataElement = dataSet.elements.x7fe00010;
    const pixelDataVrValue = pixelDataElement.vr ?? "OB";

    let pixelDataVr: "OB" | "OW";
    switch (pixelDataVrValue) {
      case "OB":
        pixelDataVr = "OB";
        break;
      case "OW":
        pixelDataVr = "OW";
        break;
      default:
        return {
          _tag: ResultTag.Err,
          value: "Unexpected pixelData VR",
        };
    }
    const pixelData = new Uint8Array(pixelDataElement.length);
    for (let idx = 0; idx < pixelDataElement.length; idx += 1) {
      pixelData[idx] = dataSet.byteArray[pixelDataElement.dataOffset + idx];
    }

    const windowCenter: number | undefined = dataSet.floatString("x00281050");
    const windowWidth: number | undefined = dataSet.floatString("x00281051");

    const voiLutFunction =
      dataSet.string("x00281056") != null
        ? (dataSet.string("x00281056") as VoiLutFunction)
        : windowCenter != null
        ? VoiLutFunction.Linear
        : undefined;

    const voiLutSequenceElement = dataSet.elements.x00283010;

    if (voiLutSequenceElement != null) {
      return {
        _tag: ResultTag.Err,
        value: "Not supported voiLutSequence",
      };
    }

    return {
      _tag: ResultTag.Ok,
      value: {
        compression,
        endianness,

        rows,
        columns,

        samplePerPixel,
        photometricInterpratation,

        planarConfiguration,

        bitsAllocated,
        bitsStored,
        highBit,

        pixelRepresentation,

        voiLutModule: {
          windowCenter,
          windowWidth,
          voiLutFunction,
        },

        pixelData,
        pixelDataVr,
      },
    };
  },
};

export enum TransferSyntax {
  JPEG2000 = "JPEG2000",
  DecodeRLE = "DecodeRLE",
  JPEGLossless = "JPEGLossless",
  JPEGBaseline = "JPEGBaseline",
  UncompressedLE = "UncompressedLE",
  UncompressedBE = "UncompressedBE",
}

export const TransferSyntax_ = {
  fromTransferSyntaxUID: (transferSyntaxUID: string): TransferSyntax => {
    switch (transferSyntaxUID) {
      case "1.2.840.10008.1.2.4.90":
      case "1.2.840.10008.1.2.4.91":
        return TransferSyntax.JPEG2000;

      case "1.2.840.10008.1.2.5":
        return TransferSyntax.DecodeRLE;

      case "1.2.840.10008.1.2.4.57":
      case "1.2.840.10008.1.2.4.70":
        return TransferSyntax.JPEGLossless;

      case "1.2.840.10008.1.2.4.50":
      case "1.2.840.10008.1.2.4.51":
        return TransferSyntax.JPEGBaseline;

      case "1.2.840.10008.1.2":
      case "1.2.840.10008.1.2.1":
        return TransferSyntax.UncompressedLE;

      case "1.2.840.10008.1.2.2":
      default:
        return TransferSyntax.UncompressedBE;
    }
  },

  toCompressionAndEndianness: (transferSyntax: TransferSyntax): [Compression, Endianness] => {
    switch (transferSyntax) {
      case TransferSyntax.UncompressedBE:
        return [Compression.None, Endianness.BigEndian];
      case TransferSyntax.UncompressedLE:
        return [Compression.None, Endianness.LittleEndian];
      case TransferSyntax.DecodeRLE:
        return [Compression.Rle, Endianness.LittleEndian];
      case TransferSyntax.JPEGLossless:
        return [Compression.JpegLossless, Endianness.LittleEndian];
      case TransferSyntax.JPEG2000:
        return [Compression.Jpeg2000, Endianness.LittleEndian];
      case TransferSyntax.JPEGBaseline:
        return [Compression.JpegBaseline, Endianness.LittleEndian];
    }
  },
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
  Rgb = "RGB",
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
