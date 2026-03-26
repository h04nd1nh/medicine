class Examination {
  final int id;
  final String createdAt;
  final String amDuong;
  final String khi;
  final String huyet;
  final List<dynamic>? syndromes;

  Examination({
    required this.id,
    required this.createdAt,
    required this.amDuong,
    required this.khi,
    required this.huyet,
    this.syndromes,
  });

  factory Examination.fromJson(Map<String, dynamic> json) {
    return Examination(
      id: json['id'],
      createdAt: json['createdAt'],
      amDuong: json['amDuong'] ?? '',
      khi: json['khi'] ?? '',
      huyet: json['huyet'] ?? '',
      syndromes: json['syndromes'],
    );
  }
}
