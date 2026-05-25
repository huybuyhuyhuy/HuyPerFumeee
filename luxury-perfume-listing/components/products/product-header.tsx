import Image from 'next/image'

interface ProductHeaderProps {
  totalProducts: number
}

export function ProductHeader({ totalProducts }: ProductHeaderProps) {
  return (
    <header className="relative">
      {/* Banner */}
      <div className="relative h-[200px] sm:h-[260px] md:h-[320px] overflow-hidden rounded-lg">
        <Image
          src="/images/perfume-banner.jpg"
          alt="Bộ sưu tập nước hoa cao cấp"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 md:px-16">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-4 tracking-tight">
            Bộ sưu tập nước hoa
          </h1>
          <p className="text-white/90 text-sm sm:text-base md:text-lg max-w-xl leading-relaxed">
            Khám phá những mùi hương được tuyển chọn cho phong cách riêng của bạn.
          </p>
        </div>
      </div>

      {/* Product Count */}
      <div className="mt-4 sm:mt-6">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">{totalProducts}</span> sản phẩm
        </p>
      </div>
    </header>
  )
}
