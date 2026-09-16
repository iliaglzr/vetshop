<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use App\Services\OrderService;

class OrderController extends Controller
{
    public function __construct(
        private OrderService $service
    ) {
    }


    /*
    |--------------------------------------------------------------------------
    | User Orders
    |--------------------------------------------------------------------------
    */

    public function index(Request $request)
    {
        return Order::with([
            'items.product',
            'payments',
        ])
            ->where(
                'user_id',
                $request->user()->id
            )
            ->latest()
            ->paginate(10);
    }


    /*
    |--------------------------------------------------------------------------
    | Show Order
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        Order $order
    ) {
        abort_unless(
            $order->user_id === $request->user()->id,
            403,
            'شما اجازه مشاهده این سفارش را ندارید.'
        );

        return $order->load([
            'items.product',
            'payments',
            'preInvoice',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | Create Order
    |--------------------------------------------------------------------------
    */

    public function store(Request $request)
    {
        $data = $request->validate([
            'payment_method' => [
                'required',
                'in:bank_transfer,check,online',
            ],

            'shipping_address' => [
                'required',
                'array',
            ],

            'shipping_address.province' => [
                'required',
                'string',
                'max:100',
            ],

            'shipping_address.city' => [
                'required',
                'string',
                'max:100',
            ],

            'shipping_address.address' => [
                'required',
                'string',
                'max:1000',
            ],

            'shipping_address.postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            'shipping_address.phone' => [
                'required',
                'string',
                'max:30',
            ],
        ]);

        $order = $this->service->create(
            $request->user()->id,
            $data
        );

        return response()->json(
            $order,
            201
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Upload Payment Receipt
    |--------------------------------------------------------------------------
    |
    | فقط برای:
    |
    | bank_transfer
    | check
    |
    | پرداخت آنلاین نباید وارد این متد شود.
    |
    */

    public function uploadPayment(
        Request $request,
        Order $order
    ) {
        /*
         * امنیت:
         * فقط صاحب سفارش می‌تواند فیش/چک خودش را ارسال کند.
         */

        abort_unless(
            $order->user_id === $request->user()->id,
            403,
            'شما اجازه تغییر این سفارش را ندارید.'
        );


        /*
         * پرداخت آنلاین نباید Receipt داشته باشد.
         */

        if ($order->payment_method === 'online') {
            return response()->json([
                'message' =>
                    'برای پرداخت آنلاین نیازی به ارسال فیش نیست.',
            ], 422);
        }


        /*
         * Validation
         */

        $data = $request->validate([
            'receipt' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'method' => [
                'required',
                'in:bank_transfer,check',
            ],
        ]);


        /*
         * اطمینان از یکسان بودن روش پرداخت
         * با سفارش.
         */

        if ($data['method'] !== $order->payment_method) {
            throw ValidationException::withMessages([
                'method' =>
                    'روش پرداخت با روش انتخاب‌شده برای سفارش یکسان نیست.',
            ]);
        }


        /*
         * Payment مربوط به سفارش
         */

        $payment = $order
            ->payments()
            ->latest()
            ->first();


        if (!$payment) {
            throw ValidationException::withMessages([
                'payment' =>
                    'رکورد پرداخت برای این سفارش پیدا نشد.',
            ]);
        }


        /*
         * اگر قبلاً پرداخت تأیید شده باشد
         */

        if ($payment->status === 'paid') {
            throw ValidationException::withMessages([
                'payment' =>
                    'این پرداخت قبلاً تأیید شده است.',
            ]);
        }


        /*
         * ذخیره فایل
         */

        $path = $request
            ->file('receipt')
            ->store(
                'payments',
                'public'
            );


        /*
         * بروزرسانی Payment
         */

        $payment->update([
            'receipt_path' => $path,
            'status' => 'waiting_verification',
            'method' => $data['method'],
        ]);


        /*
         * بروزرسانی وضعیت سفارش
         */

        if ($data['method'] === 'check') {

            $order->update([
                'status' =>
                    'waiting_for_check_verification',
            ]);

        } else {

            $order->update([
                'status' =>
                    'waiting_for_verification',
            ]);
        }


        return response()->json([
            'message' =>
                'مدرک پرداخت با موفقیت ارسال شد.',

            'order' =>
                $order
                    ->fresh()
                    ->load([
                        'items.product',
                        'payments',
                    ]),
        ]);
    }
}